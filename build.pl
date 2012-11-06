#!/usr/bin/perl
use strict;
use warnings;
use Cwd;
use File::Basename;
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

# Create the XPI file
print "\nCreating XPI file...\n";
system("zip -r $outputFilename -\@ < xpizip.txt");

# ======================================================================
# End Main Script --- Begin Subroutines
# ======================================================================

sub parseVersionFile
{
	my $filename = shift;

	open my $in, '<', "$filename" or die "Cannot open input ($filename): $!";
	my @lines = <$in>;
	close $in;
	
	open my $out, '>', "new_$filename" or die "Cannot open output (new_$filename): $!";
	
	foreach my $statement (@lines)
	{
		chomp $statement;
		if ($statement =~ m/^(\s*?)<em:version>/)
		{
			my $whitespace = $1;
			print $out "$whitespace<em:version>$version</em:version>\n";
		}
		elsif($statement =~ m/value="Version [0-9\.]+?"/)
		{
			$statement =~ s/value="[^"]+?"/value="Version $version"/;
			print $out "$statement\n";
		}
		else
		{
			print $out "$statement\n";
		}
	}
	
	close $out;
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
