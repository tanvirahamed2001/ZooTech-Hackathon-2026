#include "calcpi.h"
#include <thread>
#include <vector>
#include <cmath>

// Function to be executed by each thread
static void count_pixels_thread(int r, double start, double end, uint64_t* result)
{
    double rsq = double(r) * r;
    uint64_t count = 0;
    for (double x = start; x <= end; x++)
        for (double y = 0; y <= r; y++)
            if (x*x + y*y <= rsq) count++;
    *result = count;
}

uint64_t count_pixels(int r, int n_threads)
{
    // Make sure your multithreaded solution returns the same number of
    // pixels as the single-threaded solution below!!!
    double rsq = double(r) * r;
    uint64_t total_count = 0;
    std::vector<std::thread> threads;
    std::vector<uint64_t> results(n_threads, 0);

    // Calculate the workload for each thread
    int workload = r / n_threads;

    for (int i = 0; i < n_threads; i++) {
        // Calculate start and end for each thread
        double start = i * workload + 1;
        double end = (i == n_threads - 1) ? r : (i + 1) * workload; // Last thread takes the remainder

        // Launch thread
        threads.emplace_back(count_pixels_thread, r, start, end, &results[i]);
    }

    // Join threads and aggregate results
    for (int i = 0; i < n_threads; i++) {
        threads[i].join();
        total_count += results[i];
    }

    // Account for the symmetry in all four quadrants and the center point
    return total_count * 4 + 1;
}
