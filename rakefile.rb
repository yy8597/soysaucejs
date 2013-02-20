#!/usr/bin/ruby
require "rake"
require "jammit"
require "yaml"
require "aws-sdk"

task :default => [:build]

task :build do
  # Create build directory
  version = "v" + ENV["v"]
  puts "Soysauce: Creating build " + version + "..."
  
  begin
    Dir::mkdir("build/" + version)
  rescue
    abort("Soysauce: " + version + " already exists. Aborting.")
  end
  
  # Create soysauce.js, soysauce.min.js, and soysauce.css
  puts "Soysauce: Compiling assets..."
  
  bundleCompressed = Thread.new {
    Jammit.package!
  }
  
  bundleUncompressed = Thread.new {
    config = File.read("config/assets.yml")
    config = config.gsub(/(compress_assets:\s+)on/, "\\1off")
    config = config.gsub(/soysauce\.min/, "soysauce")

    File.rename("config/assets.yml", "config/assets2.yml")
    File.open("config/assets.yml", "w") {
      |file| file.write(config)
    }
    
    Jammit.package!
  }
  
  compileCSS = Thread.new {
    system "compass compile"
  }
  
  bundleCompressed.join
  bundleUncompressed.join
  compileCSS.join
  
  # Copy files to build directory
  File.delete("config/assets.yml");
  File.rename("config/assets2.yml", "config/assets.yml")

  FileUtils.copy("public/javascript/soysauce.js", "build/" + version)
  FileUtils.copy("public/javascript/soysauce.min.js", "build/" + version)
  FileUtils.copy("assets/soysauce.css", "build/" + version)

  FileUtils.copy("public/javascript/soysauce.js", "build/latest")
  FileUtils.copy("public/javascript/soysauce.min.js", "build/latest")
  FileUtils.copy("assets/soysauce.css", "build/latest")

  # Publish to CDN
  puts "Soysauce: Uploading to CDN..."
  config_file = File.join(File.dirname(__FILE__), "/config/cdn.yml")

  unless File.exist?(config_file)
    puts "Soysauce: File '/config/cdn.yml' does not exist."
    exit 1
  end

  config = YAML.load(File.read(config_file))

  unless config.kind_of?(Hash)
    puts "Soysauce: File '/config/cdn.yml' is incorrectly configured."
    exit 1
  end

  AWS.config(config)

  s3 = AWS::S3.new
  bucket = s3.buckets.create("soysauce")

  uploadCurrent = Thread.new {
    Dir.foreach("build/" + version) do |file|
      next if file == '.' or file == '..'
      
      file_path = version + "/" + file
      puts "Uploading " + file_path + "..."
      o = bucket.objects[file_path]
      
      if File.extname(file) =~ /\.css/
        o.write(:file => "build/" + file_path, :content_type => "text/css")
      else
        o.write(:file => "build/" + file_path, :content_type => "text/javascript")
      end
    end
  }
  
  updateLatest = Thread.new {
    Dir.foreach("build/latest") do |file|
      next if file == '.' or file == '..'

      file_path = version + "/" + file
      puts "Uploading " + "latest/" + file + "..."
      o = bucket.objects["latest/" + file]

      if File.extname(file) =~ /\.css/
        o.write(:file => "build/latest/" + file, :content_type => "text/css")
      else
        o.write(:file => "build/latest/" + file, :content_type => "text/javascript")
      end
    end
  }

  uploadCurrent.join
  updateLatest.join
  
  # Update Readme
  readme = File.read("README.md")
  
  readme = readme.gsub(/v[\d\.]+/, version)
  size = '%.2f' % (File.size("public/javascript/soysauce.min.js").to_f / 1000)
  readme = readme.gsub(/(Compressed \()[\d\.]+/, "\\1" + size)
  size = '%.2f' % (File.size("public/javascript/soysauce.js").to_f / 1000)
  readme = readme.gsub(/(Uncompressed \()[\d\.]+/, "\\1" + size)
  size = '%.2f' % (File.size("assets/soysauce.css").to_f / 1000)
  readme = readme.gsub(/(CSS \()[\d\.]+/, "\\1" + size)
  
  File.open("README.md", "w") {
    |file| file.write(readme)
  }

  # Create build tag
  pushTag = Thread.new {
    puts "Soysauce: Pushing tag to github..."
    system "git tag -a " + version + " -m 'Creating build " + version + "'"
    system "git push --tags"
  }
  
  pushTag.join

  puts "Soysauce: Build " + version + " successful!"

end
