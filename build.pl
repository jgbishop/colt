#!/usr/bin/perl
use strict;
use warnings;

use Cwd;
use File::Basename;
use File::Which;
use Getopt::Long;

our $VERSION = "1.01";

# An array of relative file paths in which a version number should be updated
my @VERSION_FILES = qw/install.rdf/;

my $bumpVersion = 0;
my $explicitVersion = '';
my $outputFilename = '';
my $outputFolder = "output";
my $outputShortname = "colt";

GetOptions("bump" => \$bumpVersion,
		   "output=s" => \$outputFilename,
		   "version=s" => \$explicitVersion,
		   "help" => sub { usageMessage() });

print "\nCoLT Build Script v$VERSION\n";
print "Written by Jonah Bishop\n\n";

my $zipProg = '7z';
my $zipPath = which($zipProg);
if (! defined $zipPath)
{
	$zipProg = '7za';
	$zipPath = which($zipProg);
	if (! defined $zipPath)
	{
		print "ERROR: Unable to locate 7-zip executable (searched for both '7z' and '7za')!\n";
		exit 1;
	}
}

print "Building extension...\n";
my $homeDir = getcwd();

if (! -d "$homeDir/$outputFolder")
{
	if(! mkdir "$homeDir/$outputFolder")
	{
		print "ERROR: Failed to create $homeDir/$outputFolder: $!";
		exit 1;
	}
}

my $versionMajor = 0;
my $versionMinor = 0;
my $versionRev = 0;

scanForVersion();

if ($bumpVersion == 1)
{
	# Bump only the versionRev portion if the user wanted to bump
	$versionRev++;
	updateVersion();
}
elsif ($explicitVersion ne '')
{
	grabVersionPieces($explicitVersion);
	updateVersion();
}

if (! $outputFilename)
{
	$outputFilename = "${outputShortname}_${versionMajor}_${versionMinor}_${versionRev}.xpi";
	print " - Output will be written to: $outputFilename\n";
}

# Create the XPI file
print "\nCreating XPI file...\n";
system("$zipProg a -tzip $outputFolder/$outputFilename \@xpizip.txt");

print "\nExtension package created successfully\n";
exit 0;

# ======================================================================
# End Main Script --- Begin Subroutines
# ======================================================================

sub grabVersionPieces
{
	my $vs = shift;
	my @pieces = split /\./, $vs;
	$versionMajor = $pieces[0] || 0;
	$versionMinor = $pieces[1] || 0;
	$versionRev = $pieces[2] || 0;
}

sub parseVersionFile
{
	my $filename = shift;

	open my $in, '<', "$filename" or die "Cannot open input ($filename): $!";
	my @lines = <$in>;
	close $in;
	
	open my $out, '>', "new_$filename" or die "Cannot open output (new_$filename): $!";
	
	foreach my $statement (@lines)
	{
		# Handle the install.rdf case
		$statement =~ s!<em:version>[0-9\.]+</em:version>!<em:version>$versionMajor.$versionMinor.$versionRev</em:version>!;
		
		print $out $statement;
	}
	
	close $out;
}

sub scanForVersion
{
	print " - Scanning for version string\n";
	
	open my $in, '<', 'install.rdf' or die "Cannot open install.rdf to scan version string: $!";
	while (<$in>)
	{
		if (m!<em:version>([0-9\.]+)</em:version>!)
		{
			my $vs = $1;
			print "   Found version string: $vs\n\n";
			grabVersionPieces($vs);
			last;
		}
	}
	close $in;
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
	print <<USAGE;
Options:
  --bump
    Bumps the revision version portion of the version string (i.e. the third
    value: X.Y.Z)
    
  --output <FILENAME>
    Explicitly sets the output XPI filename
    
  --version <VERSION>
    Explicitly sets the version string to use
USAGE

	exit();
}
