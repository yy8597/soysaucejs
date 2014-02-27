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
    puts "Soysauce: " + version + " already exists. Overwriting..."
    begin
      FileUtils.rm_r "build/" + version, :force => true
      Dir::mkdir("build/" + version)
    rescue
      abort("Soysauce: Unable to overwrite directory. Aborting.")
    end
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
      config = config.gsub(/soysauce\.min/, "soysauce\\1")

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

  FileUtils.copy("public/soysauce.js.gz", "build/" + version + "/soysauce.js")
  FileUtils.copy("public/soysauce.min.js.gz", "build/" + version + "/soysauce.min.js")
  FileUtils.copy("public/soysauce.css", "build/" + version)

  FileUtils.copy("public/soysauce.js.gz", "build/latest/soysauce.js")
  FileUtils.copy("public/soysauce.min.js.gz", "build/latest/soysauce.min.js")
  FileUtils.copy("public/soysauce.css", "build/latest")

  # Publish to CDN
  puts "Soysauce: Uploading to CDN..."

  config = YAML.load(File.read(config_file))

  unless config.kind_of?(Hash)
    abort("Soysauce: File '/config/cdn.yml' is incorrectly configured. Aborting.")
  end

  AWS.config(config)

  s3 = AWS::S3.new

  bucket = s3.buckets["express-cdn"]

  if !bucket.exists?
    bucket = s3.buckets.create("express-cdn")
  end

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
          o.write(:file => "build/" + file_path, :content_type => "text/javascript", :content_encoding => "gzip", :acl => :public_read)
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
          o.write(:file => "build/latest/" + file, :content_type => "text/javascript", :content_encoding => "gzip", :acl => :public_read)
        end
      end
    end
  }

  uploadCurrent.join
  updateLatest.join

  # Update Readme
  readme = File.read("README.md")

  readme = readme.gsub(/v[\d\.]+/, version)
  size = '%.2f' % (File.size("public/soysauce.min.js.gz").to_f / 1000)
  readme = readme.gsub(/(Compressed \()[\d\.]+/, "\\1" + size)
  size = '%.2f' % (File.size("public/soysauce.js.gz").to_f / 1000)
  readme = readme.gsub(/(Uncompressed \()[\d\.]+/, "\\1" + size)
  size = '%.2f' % (File.size("assets/soysauce.css").to_f / 1000)
  readme = readme.gsub(/(CSS \()[\d\.]+/, "\\1" + size)

  File.open("README.md", "w") {
    |file| file.write(readme)
  }

  # Update bower.json
  bower = File.read("bower.json")
  bower = bower.gsub(/"version":\s+"[\d\.]+"/, '"version": "' + ENV["v"] + '"')
  File.open("bower.json", "w") {
    |file| file.write(bower)
  }

  # Create build tag
  pushTag = Thread.new {
    puts "Soysauce: Pushing tag to github..."
    system "git commit -am 'Creating build " + version + "'"
    system "git tag -a " + version + " -m 'Creating build " + version + "' -f"
    system "git push --tags -f"
    system "git push origin master"
  }

  pushTag.join

  puts "Soysauce: Build " + version + " successful!"

end

task :beta do
  # Check if config exists
  config_file = File.join(File.dirname(__FILE__), "/config/cdn.yml")

  unless File.exist?(config_file)
    abort("Soysauce: File '/config/cdn.yml' does not exist. Ask @egaba88 for the key or create your own. Aborting.")
  end

  # Create build directory
  version = "v" + ENV["v"]
  puts "Soysauce: Creating beta build " + version + "..."

  if (!File.directory? "build")
    Dir::mkdir("build")
  end

  if (!File.directory? "build/latest")
    Dir::mkdir("build/latest")
  end

  begin
    Dir::mkdir("build/" + version)
  rescue
    puts "Soysauce: " + version + " already exists. Overwriting..."
    begin
      FileUtils.rm_r "build/" + version, :force => true
      Dir::mkdir("build/" + version)
    rescue
      abort("Soysauce: Unable to overwrite directory. Aborting.")
    end
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
      config = config.gsub(/soysauce\.min/, "soysauce\\1")

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

  FileUtils.copy("public/soysauce.js.gz", "build/" + version + "/soysauce.js")
  FileUtils.copy("public/soysauce.min.js.gz", "build/" + version + "/soysauce.min.js")
  FileUtils.copy("assets/soysauce.css", "build/" + version)

  FileUtils.copy("public/soysauce.js.gz", "build/latest/soysauce.js")
  FileUtils.copy("public/soysauce.min.js.gz", "build/latest/soysauce.min.js")
  FileUtils.copy("assets/soysauce.css", "build/latest")

  # Publish to CDN
  puts "Soysauce: Uploading to CDN..."

  config = YAML.load(File.read(config_file))

  unless config.kind_of?(Hash)
    abort("Soysauce: File '/config/cdn.yml' is incorrectly configured. Aborting.")
  end

  AWS.config(config)

  s3 = AWS::S3.new

  bucket = s3.buckets["express-cdn"]

  if !bucket.exists?
    bucket = s3.buckets.create("express-cdn")
  end

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
          o.write(:file => "build/" + file_path, :content_type => "text/javascript", :content_encoding => "gzip", :acl => :public_read)
        end
      end
    end
  }

  uploadCurrent.join

  puts "Soysauce: Build " + version + " successful!"

end
