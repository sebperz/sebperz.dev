---
id: 5
name: Distributed File System
description: A Golang-based distributed file system with replication and fault tolerance.
tags: [Go, Distributed Systems, Storage]
---

## What it is

Built a distributed file system that shards data across multiple nodes with automatic replication. Implements the Raft consensus algorithm for leader election and log replication.

## What I learned

- Raft consensus algorithm implementation
- Distributed systems failure modes and handling
- Go concurrency patterns with goroutines and channels
- CAP theorem trade-offs in distributed storage

## What can be improved

- Add erasure coding for better storage efficiency
- Implement automatic rebalancing when nodes join/leave
- Add snapshot and point-in-time recovery
- Create a FUSE filesystem driver for native access
