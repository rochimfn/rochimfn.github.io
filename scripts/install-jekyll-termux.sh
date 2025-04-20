#!/usr/bin/env bash

pkg install -y ruby build-essential zlib
retVal=$?
if [ $retVal -ne 0 ]; then
    echo ""
    echo "error install ruby"
    exit $retVal
fi

echo ""
echo '# Install Ruby Gems to ~/gems' >> ~/.bashrc
echo 'export GEM_HOME="$HOME/gems"' >> ~/.bashrc
echo 'export PATH="$HOME/gems/bin:$PATH"' >> ~/.bashrc

export GEM_HOME="$HOME/gems"
export PATH="$HOME/gems/bin:$PATH"
gem install bundler
retVal=$?
if [ $retVal -ne 0 ]; then
    echo ""
    echo "error install bundler"
    exit $retVal
fi

echo ""
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
PROJECT_DIR=$SCRIPT_DIR/../
cd $PROJECT_DIR
bundle install
retVal=$?
if [ $retVal -ne 0 ]; then
    echo ""
    echo "error install dependencies"
    exit $retVal
fi

echo ""
echo "run below command to start jekyll:"
echo ""
echo "source ~/.bashrc"
echo "bundle exec jekyll serve"
echo ""
