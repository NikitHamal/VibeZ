cmake_minimum_required(VERSION 3.22.1)
project(nodebridge)

add_library(nodebridge SHARED nodebridge.cpp)

find_library(log-lib log)

# In a full setup, link Node.js Mobile static libs here

set_target_properties(nodebridge PROPERTIES CXX_STANDARD 17)

target_link_libraries(nodebridge ${log-lib})