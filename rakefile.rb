#!/usr/bin/ruby
require "rake"
require "jammit"
require "asset_sync"

# CDN Info
PROVIDER = "AWS"
FOG_DIRECTORY = "soysauce"
ACCESS_KEY_ID = "AKIAIU3WR5GFI4LDXEOA"
SECRET_ACCESS_KEY = "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"

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
  bundle = Thread.new {
    Jammit.package!
  }
  
  bundle.join
  
  config = File.read("config/assets.yml")
  config = config.gsub(/(compress_assets:\s+)on/, "\\1off")
  config = config.gsub(/soysauce\.min/, "soysauce")
  
  File.rename("config/assets.yml", "config/assets2.yml")
  File.open("config/assets.yml", "w") {
    |file| file.write(config)
  }
  
  bundle = Thread.new {
    Jammit.package!
    system "compass compile"
  }
  
  bundle.join
  
  # Copy files to build directory
  File.delete("config/assets.yml");
  File.rename("config/assets2.yml", "config/assets.yml")

  FileUtils.copy("public/javascript/soysauce.js", "build/" + version)
  FileUtils.copy("public/javascript/soysauce.min.js", "build/" + version)
  FileUtils.copy("assets/soysauce.css", "build/" + version)

  FileUtils.copy("public/javascript/soysauce.js", "build/latest")
  FileUtils.copy("public/javascript/soysauce.min.js", "build/latest")
  FileUtils.copy("assets/soysauce.css", "build/latest")

  # Create build tag
  pushTag = Thread.new {
    puts "Soysauce: Pushing tag to github..."
    system "git tag -a " + version "-m 'Creating build " + version
  }
  
  pushTag.join

  # Publish to CDN (currently not working, something to do with the paths... sync manually)
  # if defined?(AssetSync)
  #     puts "Soysauce: Publishing assets to CDN..."
  #     
  #     AssetSync.configure do |config|
  #       config.fog_provider = PROVIDER
  #       config.fog_directory = FOG_DIRECTORY
  #       config.aws_access_key_id = ACCESS_KEY_ID
  #       config.aws_secret_access_key = SECRET_ACCESS_KEY
  #       config.prefix = "assets"
  #       config.public_path = Pathname("./build")
  #     end
  #     
  #     AssetSync.sync
  #   end
  
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

  puts "Soysauce: Build " + version + " successful!"

end
