#!/usr/bin/env ruby

require "time"

print "New Post Title: "
post_title = gets.chomp
now = Time.now
frontmatter = <<~EOT
---
layout: post
title: "#{post_title}"
date: #{now}
categories: []
---
EOT

s_post_title = post_title.downcase.gsub(/\s/, '-')
filename = "#{now.to_date.to_s}-#{s_post_title}.md"
scriptpath = File.expand_path(File.dirname(__FILE__))
path = scriptpath + "/../_posts/" + filename
f = File.new(path, "wx")
f.write(frontmatter)
f.close

puts filename