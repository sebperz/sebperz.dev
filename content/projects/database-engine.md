---
id: 4
name: Database Engine
description: Simple key-value store with B-tree indexing, transaction support, and ACID compliance.
tags: [Rust, Database, Storage, Systems]
---

## What it is

A persistent key-value database engine written in Rust. Features B-tree indexing for efficient lookups, write-ahead logging for durability, and MVCC for concurrent transactions. The storage engine uses a log-structured merge tree (LSM) architecture with B-tree indexes for point lookups. I implemented a custom page cache with LRU eviction and write-back buffering to minimize disk I/O. The transaction manager provides ACID guarantees using a write-ahead log with fsync coordination and two-phase locking for isolation. MVCC implementation uses version chains and snapshot isolation to allow concurrent reads without blocking writes. The query engine supports range scans, prefix searches, and batch operations. I added compression using Snappy for values and Bloom filters to avoid unnecessary disk reads for non-existent keys. The system includes crash recovery that replays the WAL on startup to restore consistent state. I also implemented compaction to reclaim space from deleted and overwritten entries.

## What I learned

- B-tree data structure implementation with node splitting, merging, and rebalancing operations
- Write-ahead logging (WAL) patterns including log sequence numbers and checkpointing for recovery
- MVCC and transaction isolation levels with handling of read skew and write skew anomalies
- File I/O and page caching strategies including direct I/O, memory-mapped files, and async I/O
- Lock management and deadlock detection in concurrent transaction processing systems
- Storage engine design trade-offs between B-trees, LSM trees, and hash indexes
- Crash recovery algorithms including ARIES and shadow paging techniques
- Buffer pool management with clock algorithm and dirty page tracking for write-back
- Distributed transaction protocols including two-phase commit and consensus algorithms

## What can be improved

- Add SQL query parser and planner with cost-based optimization and join algorithms
- Implement secondary indexes including hash indexes and covering indexes for query acceleration
- Add replication support with synchronous and asynchronous modes for high availability
- Optimize storage format with compression, dictionary encoding, and columnar storage for analytics
- Implement distributed transactions across multiple nodes with consensus and failure handling
- Add support for geospatial indexes using R-trees for location-based queries
- Implement full-text search with inverted indexes and relevance scoring
- Create a query optimizer that uses statistics and histograms for better plan selection
