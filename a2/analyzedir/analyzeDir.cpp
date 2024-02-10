#include "analyzeDir.h" 
#include <iostream>
#include <fstream>      // For file operations
#include <vector>
#include <unordered_map> // For storing word counts
#include <map>           // For storing directory sizes
#include <algorithm>     // For sorting
#include <filesystem>    // For directory traversal
#include <set>           // For tracking visited directories
#include <regex>         // For regex operations on text files
#include <cctype>        // For character type checking
#include <cstdio>        // For popen and pclose
#include <cstdlib>
#include <cstring>

// Namespace for filesystem operations
namespace fs = std::filesystem;

// Function to get the dimensions of an image using the ImageMagick `identify` command
std::pair<int, int> getImageDimensions(const std::string& imagePath) {
    // Prepare the command to get image dimensions
    char command[512];
    std::snprintf(command, sizeof(command), "identify -format '%%wx%%h' \"%s\" 2>/dev/null", imagePath.c_str());
    FILE* pipe = popen(command, "r");
    if (!pipe) return {-1, -1}; // Early return if the command fails
    
    int width, height;
    // Parse the output of the command for width and height
    if (fscanf(pipe, "%dx%d", &width, &height) == 2) {
        pclose(pipe);
        return {width, height}; // Return dimensions if successfully parsed
    } else {
        pclose(pipe);
        return {-1, -1}; // Return error indicator if parsing fails
    }
}

// Function to process a text file and count the occurrences of words longer than 5 characters
void processTextFile(const fs::path& filePath, std::unordered_map<std::string, int>& wordCounts) {
    std::ifstream file(filePath);
    std::string word;
    // Read words from the file
    while (file >> word) {
        // Regular expression to match words longer than 5 characters
        std::regex word_regex("[a-zA-Z]{6,}");
        std::smatch match;
        // Find and count matching words
        while (std::regex_search(word, match, word_regex)) {
            std::string matchedWord = match.str(0);
            std::transform(matchedWord.begin(), matchedWord.end(), matchedWord.begin(), ::tolower);
            wordCounts[matchedWord]++;
            word = match.suffix().str();
        }
    }
}

// Function to check if a directory is vacant (contains no files directly within it)
bool isVacant(const fs::path& dir, std::set<fs::path>& checkedDirectories, std::vector<std::string>& vacantDirs) {
    if (checkedDirectories.find(dir) != checkedDirectories.end()) return false; // Skip if already checked
    bool isEmpty = true;
    for (const auto& entry : fs::directory_iterator(dir)) {
        if (entry.is_regular_file()) {
            isEmpty = false; // Not empty if a file is found
            break;
        } else if (entry.is_directory()) {
            // Recursively check subdirectories
            isEmpty &= isVacant(entry.path(), checkedDirectories, vacantDirs);
        }
    }
    if (isEmpty) {
        // Add to vacant directories if empty
        vacantDirs.push_back(fs::relative(dir, fs::current_path()).string());
    }
    checkedDirectories.insert(dir); // Mark as checked
    return isEmpty;
}

// Function to recursively find vacant directories, ensuring top-level vacant directories are identified without including their subdirectories
void findVacantDirectories(const fs::path& dir, std::set<fs::path>& checkedDirectories, std::vector<std::string>& vacantDirs, bool& isParentVacant) {
    if (checkedDirectories.find(dir) != checkedDirectories.end()) return;
    
    bool isEmpty = true;
    for (const auto& entry : fs::recursive_directory_iterator(dir, fs::directory_options::skip_permission_denied)) {
        if (entry.is_regular_file()) {
            isEmpty = false;
            break; // Found a file, so this directory is not vacant
        }
    }
    
    // Mark directory as checked before recursing into subdirectories
    checkedDirectories.insert(dir);

    // If directory is empty and not a subdirectory of an already identified vacant directory
    if (isEmpty) {
        std::string relativePath = fs::relative(dir, fs::current_path()).string();
        // Normalize relative path
        if (relativePath.empty()) {
            relativePath = ".";
        } else if (relativePath.find("./") == 0) {
            relativePath = relativePath.substr(2);
        }
        
        // Add to vacant directories if not already covered by a parent vacant directory
        if (!isParentVacant) {
            vacantDirs.push_back(relativePath);
            isParentVacant = true; // Prevent adding subdirectories of this vacant directory
        }
    } else {
        isParentVacant = false; // Reset for sibling directories
    }

    // Recursively check subdirectories
    for (const auto& entry : fs::directory_iterator(dir)) {
        if (entry.is_directory()) {
            bool subDirParentVacant = false; // Use a separate flag for each subdirectory
            findVacantDirectories(entry.path(), checkedDirectories, vacantDirs, subDirParentVacant);
        }
    }
}
// Main function to analyze a directory and gather statistics
Results analyzeDir(int n) {
    // Results initialization and variable declarations
    Results results;
    std::unordered_map<std::string, int> wordCounts; // To count occurrences of words
    std::map<fs::path, long> directorySizes; // To track sizes of directories
    std::set<fs::path> visitedDirectories; // To keep track of visited directories
    std::vector<std::string> vacantDirs; // To list vacant directories
    std::vector<ImageInfo> images; // To store information about images
    long largestFileSize = -1; // Initialize largest file size to -1 (no files case)
    fs::path largestFilePath; // To store the path of the largest file
    long totalFileSize = 0; // To accumulate total file size
    long fileCount = 0; // To count the number of files
    fs::path rootPath = fs::current_path(); // Starting directory for analysis

    for (const auto& entry : fs::recursive_directory_iterator(rootPath)) {
        const auto& path = entry.path();
        fs::path relativePath = fs::relative(path, rootPath);

        if (entry.is_regular_file()) {
            long fileSize = fs::file_size(path);
            totalFileSize += fileSize;
            ++fileCount;
            directorySizes[path.parent_path()] += fileSize; // Accumulate file sizes per directory.
            if (fileSize > largestFileSize) {
                largestFileSize = fileSize;
                largestFilePath = relativePath;
            }
            if (relativePath.extension() == ".txt") {
                processTextFile(relativePath, wordCounts);
            }
            auto dimensions = getImageDimensions(path.string());
            if (dimensions.first > 0 && dimensions.second > 0) {
                images.push_back({relativePath.string(), dimensions.first, dimensions.second});
            }
        } else if (entry.is_directory()) {
            visitedDirectories.insert(relativePath);
        }
    }

    // Vacant directories check
   
    std::set<fs::path> checkedDirectories;   
    bool isParentVacant = false; // This should be outside the findVacantDirectories call
    findVacantDirectories(rootPath, checkedDirectories, vacantDirs, isParentVacant);

    
    isVacant(rootPath, checkedDirectories, vacantDirs);

    results.largest_file_path = largestFilePath.empty() ? "." : largestFilePath.string();
    results.largest_file_size = largestFileSize;
    results.n_files = visitedDirectories.size(); // This should be the count of files, not directories
    results.n_dirs = visitedDirectories.size() + 1; // Include the current directory
    results.all_files_size = totalFileSize;
    
    // Process most common words
    std::vector<std::pair<std::string, int>> sortedWords(wordCounts.begin(), wordCounts.end());
    std::sort(sortedWords.begin(), sortedWords.end(), [](const auto& a, const auto& b) {
        return a.second > b.second || (a.second == b.second && a.first < b.first);
    });
    if (sortedWords.size() > n) sortedWords.resize(n);
    for (const auto& pair : sortedWords) {
        results.most_common_words.push_back(pair);
    }

    // Process largest directories
    std::map<fs::path, long> filteredDirectorySizes;
    for (const auto& [dirPath, size] : directorySizes) {
        if (size > 0) { // Only include directories with size greater than 0
            filteredDirectorySizes[dirPath] = size;
        }
    }

   std::vector<std::pair<std::string, long>> sortedDirectorySizes;

    for (const auto& [dirPath, size] : filteredDirectorySizes) {
        if (size > 0) { // Filter out directories with no size
            std::string dirName = dirPath.filename().string();
            if (dirPath == fs::current_path()) {
                dirName = ".";
            } else {
                // For nested directories, ensure we're using the full relative path from the current directory
                auto relativePath = fs::relative(dirPath, fs::current_path());
                dirName = relativePath.string();
            }
            sortedDirectorySizes.push_back({dirName, size});
        }
    }


    // Sort the directories based on their sizes and names if sizes are equal
    std::sort(sortedDirectorySizes.begin(), sortedDirectorySizes.end(),
        [](const std::pair<std::string, long>& a, const std::pair<std::string, long>& b) {
            if (a.second != b.second) return a.second > b.second;
            return a.first < b.first;
        });

    // Keep only the top N entries if necessary
    if (sortedDirectorySizes.size() > static_cast<size_t>(n)) {
        sortedDirectorySizes.resize(n);
    }

    results.largest_dirs.clear();
    for (const auto& [dir, size] : sortedDirectorySizes) {
        results.largest_dirs.push_back({dir, size});
    }

    // Process images
    std::sort(images.begin(), images.end(), [](const ImageInfo& a, const ImageInfo& b) {
        return a.width * a.height > b.width * b.height ||
               (a.width * a.height == b.width * b.height && a.path < b.path);
    });
    if (images.size() > n) images.resize(n);
    results.largest_images = images;

    // Update to correctly calculate n_files and n_dirs
    results.n_files = fileCount;
    results.n_dirs = visitedDirectories.size() + 1; // Include the current directory

    results.all_files_size = totalFileSize;
    results.vacant_dirs = vacantDirs;

    return results;
}
