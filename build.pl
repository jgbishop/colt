#!/usr/bin/perl -w
use strict;
use Cwd;
use File::Basename;
use File::Copy;
use Getopt::Long;

# An array of relative file paths in which a version number should be updated
my @VERSION_FILES = qw/install.rdf/;

my $jarFile = "colt.jar";
my $outputFilename = "colt.xpi";
my $version = '';

GetOptions("output=s" => \$outputFilename,
		   "version=s" => \$version,
		   "help" => sub { usageMessage() });

print "+--------------------------------+\n";
print "| Firefox Extension Build Script |\n";
print "| Written by Jonah Bishop        |\n";
print "+--------------------------------+\n";
print "Building extension...\n";
my $homeDir = getcwd();

if (!$version)
{
	print "Skipping version update.\n";
}
else
{
	updateVersion();
}

# We need to modify the chrome manifest for distribution, since we now use that exclusively
# Temporarily rename the chrome manifest that we use for dynamic development purposes
print "Modifying chrome manifest...\n";
print "  + Backing up development chrome manifest\n";
rename("chrome.manifest", "chrome.manifest.dev") or die "Could not rename chrome manifest: $!";

print "  + Updating chrome manifest for distribution\n";
open INPUT, "< chrome.manifest.dev" or die "Could not open chrome.manifest.dev: $!";
my @cmLines = <INPUT>;
close INPUT;

open OUT, "> chrome.manifest" or die "Cannot open chrome.manifest: $!";
foreach (@cmLines)
{
	chomp;
	if (m/^content/ || m/^skin/ || m/^locale/)
	{
		s#chrome/#jar:chrome/${jarFile}!/#;
	}
	print OUT "$_\n";
}
close OUT;

chdir "$homeDir/chrome" or die "Cannot change to $homeDir/chrome: $!";

# Create the JAR file
print "Creating JAR file...\n";
system("zip -r $jarFile -\@ < jarzip.txt");

chdir "$homeDir" or die "Cannot change to $homeDir: $!";

# Now create the XPI file
print "\nCreating XPI file...\n";
system("zip -r $outputFilename -\@ < xpizip.txt");

# Remove the chrome manifest that we hacked for distribution
print "\nRestoring the development chrome manifest...\n";
unlink "chrome.manifest";

# Restore the development copy of the chrome manifest
rename("chrome.manifest.dev", "chrome.manifest") or die "Could not rename chrome.manifest.dev: $!";

# ======================================================================
# End Main Script --- Begin Subroutines
# ======================================================================

sub parseVersionFile
{
	my $filename = shift;

	open INPUT, "< $filename" or die "Cannot open input ($filename): $!";
	my @lines = <INPUT>;
	close INPUT;
	
	open OUTPUT, "> new_$filename" or die "Cannot open output (new_$filename): $!";
	
	foreach my $statement (@lines)
	{
		chomp $statement;
		if ($statement =~ m/^(\s*?)<em:version>/)
		{
			my $whitespace = $1;
			print OUTPUT "$whitespace<em:version>$version</em:version>\n";
		}
		elsif($statement =~ m/value="Version [0-9\.]+?"/)
		{
			$statement =~ s/value="[^"]+?"/value="Version $version"/;
			print OUTPUT "$statement\n";
		}
		else
		{
			print OUTPUT "$statement\n";
		}
	}
	
	close OUTPUT;
}

sub updateVersion
{
	foreach my $file (@VERSION_FILES)
	{
		print "Updating version information in $file\n";
		my $dirname = dirname($file);
		my $basename = basename($file);

		chdir $dirname or die "Cannot change to $dirname: $!";
		&parseVersionFile($basename);
		
		print " - Removing $basename\n";
		unlink $basename;
	
		print " - Renaming new_$basename\n\n";
		rename ("new_$basename", $basename);
	
		chdir $homeDir or die "Cannot change to $homeDir: $!";
	}
}

sub usageMessage
{
	print "Options:\n";
	print "  --output <FILENAME>\n";
	print "    Specify the output XPI filename\n\n";
	print "  --version <VERSION>\n";
	print "    Specify the version string to use for this extension\n";
	exit();
}
