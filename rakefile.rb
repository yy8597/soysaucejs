#!/usr/bin/ruby
require "rake"
require "jammit"
require "yaml"
require "aws-sdk"

task :default => [:build]

task :build do
  # Check if config exists
  config_file = File.join(File.dirname(__FILE__), "/config/cdn.yml")
  
  unless File.exist?(config_file)
    abort("Soysauce: File '/config/cdn.yml' does not exist. Ask @egaba88 for the key or create your own. Aborting.")
  end
  
  # Create build directory
  version = "v" + ENV["v"]
  puts "Soysauce: Creating build " + version + "..."
  
  if (!File.directory? "build")
    Dir::mkdir("build")
  end
  
  if (!File.directory? "build/latest")
    Dir::mkdir("build/latest")
  end
  
  begin
    Dir::mkdir("build/" + version)
  rescue
    abort("Soysauce: " + version + " already exists. Aborting.")
  end
  
  # Create soysauce.js, soysauce.min.js, and soysauce.css
  puts "Soysauce: Compiling assets..."
  
  bundleMutex = Mutex.new
  
  bundleCompressed = Thread.new {
    bundleMutex.synchronize do
      Jammit.package!
    end
  }
  
  bundleCompressed.join
  
  bundleUncompressed = Thread.new {
    bundleMutex.synchronize do
      config = File.read("config/assets.yml")
      config = config.gsub(/(compress_assets:\s+)on/, "\\1off")
      config = config.gsub(/soysauce(\.lite|\.legacy)?\.min/, "soysauce\\1")
      
      File.rename("config/assets.yml", "config/assets2.yml")
      File.open("config/assets.yml", "w") {
        |file| file.write(config)
      }
      Jammit.package!
    end
  }
  
  compileCSS = Thread.new {
    system "compass compile"
  }
  
  bundleUncompressed.join
  compileCSS.join
  
  # Copy files to build directory
  File.delete("config/assets.yml");
  File.rename("config/assets2.yml", "config/assets.yml")

  FileUtils.copy("public/javascript/soysauce.js", "build/" + version)
  FileUtils.copy("public/javascript/soysauce.lite.js", "build/" + version)
  FileUtils.copy("public/javascript/soysauce.legacy.js", "build/" + version)
  FileUtils.copy("public/javascript/soysauce.min.js", "build/" + version)
  FileUtils.copy("public/javascript/soysauce.lite.min.js", "build/" + version)
  FileUtils.copy("public/javascript/soysauce.legacy.min.js", "build/" + version)
  FileUtils.copy("assets/soysauce.css", "build/" + version)

  FileUtils.copy("public/javascript/soysauce.js", "build/latest")
  FileUtils.copy("public/javascript/soysauce.lite.js", "build/latest")
  FileUtils.copy("public/javascript/soysauce.legacy.js", "build/latest")
  FileUtils.copy("public/javascript/soysauce.min.js", "build/latest")
  FileUtils.copy("public/javascript/soysauce.lite.min.js", "build/latest")
  FileUtils.copy("public/javascript/soysauce.legacy.min.js", "build/latest")
  FileUtils.copy("assets/soysauce.css", "build/latest")

  # Publish to CDN
  puts "Soysauce: Uploading to CDN..."

  config = YAML.load(File.read(config_file))

  unless config.kind_of?(Hash)
    abort("Soysauce: File '/config/cdn.yml' is incorrectly configured. Aborting.")
  end

  AWS.config(config)

  s3 = AWS::S3.new
  bucket = s3.buckets.create("express-cdn")

  bucketMutex = Mutex.new

  uploadCurrent = Thread.new {
    Dir.foreach("build/" + version) do |file|
      next if file == '.' or file == '..'
      
      file_path = version + "/" + file
      puts "Uploading soysauce/" + file_path + "..."
      
      bucketMutex.synchronize do
        o = bucket.objects["soysauce/" + file_path]
        if File.extname(file) =~ /\.css/
          o.write(:file => "build/" + file_path, :content_type => "text/css", :acl => :public_read)
        else
          o.write(:file => "build/" + file_path, :content_type => "text/javascript", :acl => :public_read)
        end
      end
    end
  }
  
  updateLatest = Thread.new {
    Dir.foreach("build/latest") do |file|
      next if file == '.' or file == '..'

      puts "Uploading soysauce/latest/" + file + "..."
      
      bucketMutex.synchronize do
        o = bucket.objects["soysauce/latest/" + file]
        if File.extname(file) =~ /\.css/
          o.write(:file => "build/latest/" + file, :content_type => "text/css", :acl => :public_read)
        else
          o.write(:file => "build/latest/" + file, :content_type => "text/javascript", :acl => :public_read)
        end
      end
    end
  }
  
  uploadCurrent.join
  updateLatest.join
  
  # Update Readme
  readme = File.read("README.md")
  
  readme = readme.gsub(/v[\d\.]+/, version)
  size = '%.2f' % (File.size("public/javascript/soysauce.lite.min.js").to_f / 1000)
  readme = readme.gsub(/(Compressed Lite \()[\d\.]+/, "\\1" + size)
  size = '%.2f' % (File.size("public/javascript/soysauce.legacy.min.js").to_f / 1000)
  readme = readme.gsub(/(Compressed Legacy \()[\d\.]+/, "\\1" + size)
  size = '%.2f' % (File.size("public/javascript/soysauce.min.js").to_f / 1000)
  readme = readme.gsub(/(Compressed \()[\d\.]+/, "\\1" + size)
  size = '%.2f' % (File.size("public/javascript/soysauce.lite.js").to_f / 1000)
  readme = readme.gsub(/(Uncompressed Lite \()[\d\.]+/, "\\1" + size)
  size = '%.2f' % (File.size("public/javascript/soysauce.legacy.js").to_f / 1000)
  readme = readme.gsub(/(Uncompressed Legacy \()[\d\.]+/, "\\1" + size)
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
    system "git commit -am 'Creating build " + version + "'"
    system "git tag -a " + version + " -m 'Creating build " + version + "'"
    system "git push --tags"
  }
  
  pushTag.join

  puts "Soysauce: Build " + version + " successful!"

end
