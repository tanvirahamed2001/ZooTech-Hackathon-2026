#include "analyzeDir.h"
#include <iostream>
#include <fstream>
#include <vector>
#include <unordered_map>
#include <algorithm>
#include <filesystem>
#include <set>
#include <regex>
#include <cctype>
#include <cstdio>
#include <cstdlib>
#include <cstring>

namespace fs = std::filesystem;

std::pair<int, int> getImageDimensions(const std::string& imagePath) {
    char command[512];
    std::snprintf(command, sizeof(command), "identify -format '%%wx%%h' \"%s\" 2>/dev/null", imagePath.c_str());
    FILE* pipe = popen(command, "r");
    if (!pipe) return {-1, -1};
    
    int width, height;
    if (fscanf(pipe, "%dx%d", &width, &height) == 2) {
        pclose(pipe);
        return {width, height};
    } else {
        pclose(pipe);
        return {-1, -1};
    }
}

void processTextFile(const fs::path& filePath, std::unordered_map<std::string, int>& wordCounts) {
    std::ifstream file(filePath);
    std::string word;
    while (file >> word) {
        std::regex word_regex("[a-zA-Z]{6,}");
        std::smatch match;
        while (std::regex_search(word, match, word_regex)) {
            std::string matchedWord = match.str(0);
            std::transform(matchedWord.begin(), matchedWord.end(), matchedWord.begin(), ::tolower);
            wordCounts[matchedWord]++;
            word = match.suffix().str();
        }
    }
}

bool isVacant(const fs::path& dir, std::set<fs::path>& checkedDirectories, std::vector<std::string>& vacantDirs) {
    if (checkedDirectories.find(dir) != checkedDirectories.end()) return false;
    bool isEmpty = true;
    for (const auto& entry : fs::directory_iterator(dir)) {
        if (entry.is_regular_file()) {
            isEmpty = false;
            break;
        } else if (entry.is_directory()) {
            isEmpty &= isVacant(entry.path(), checkedDirectories, vacantDirs);
        }
    }
    if (isEmpty) {
        vacantDirs.push_back(fs::relative(dir, fs::current_path()).string());
    }
    checkedDirectories.insert(dir);
    return isEmpty;
}

Results analyzeDir(int n) {
    Results results;
    std::unordered_map<std::string, int> wordCounts;
    std::map<fs::path, long> directorySizes;
    std::set<fs::path> visitedDirectories;
    std::vector<std::string> vacantDirs;
    std::vector<ImageInfo> images;
    long largestFileSize = 0;
    fs::path largestFilePath;
    long totalFileSize = 0;
    fs::path rootPath = fs::current_path();

    for (const auto& entry : fs::recursive_directory_iterator(rootPath)) {
        const auto& path = entry.path();
        fs::path relativePath = fs::relative(path, rootPath);

        if (entry.is_regular_file()) {
            long fileSize = fs::file_size(path);
            totalFileSize += fileSize;
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

    // Convert directorySizes to a vector of pairs and sort it
std::vector<std::pair<std::string, long>> sortedDirectorySizes;
for (const auto& dirSize : directorySizes) {
    // Use relative path for directory name
    std::string dirName = dirSize.first.string();
    // Ensure the directory name is relative to the current directory and doesn't start with "./"
    if (dirName.find("./") == 0) {
        dirName = dirName.substr(2);
    }
    if (dirName.empty()) dirName = "."; // Current directory
    sortedDirectorySizes.push_back(std::make_pair(dirName, dirSize.second));
}

// Sort directories by size, then by name
std::sort(sortedDirectorySizes.begin(), sortedDirectorySizes.end(), 
    [](const std::pair<std::string, long>& a, const std::pair<std::string, long>& b) {
        if (a.second != b.second) return a.second > b.second; // Sort by size
        return a.first < b.first; // Then by name
    });

// Keep only the top N directories, if N is less than the total number of directories
if (sortedDirectorySizes.size() > static_cast<size_t>(n)) {
    sortedDirectorySizes.resize(n);
}

// Populate the largest_dirs vector in results
for (const auto& dir : sortedDirectorySizes) {
    results.largest_dirs.push_back(std::make_pair(dir.first, static_cast<int>(dir.second)));
}

    // Process images
    std::sort(images.begin(), images.end(), [](const ImageInfo& a, const ImageInfo& b) {
        return a.width * a.height > b.width * b.height ||
               (a.width * a.height == b.width * b.height && a.path < b.path);
    });
    if (images.size() > n) images.resize(n);
    results.largest_images = images;

    results.n_dirs = visitedDirectories.size() + 1; // Increment directory count by one
    results.vacant_dirs = vacantDirs;

    return results;
    
    return results;
}


