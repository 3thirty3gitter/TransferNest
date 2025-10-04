# Universal Support Library

This library contains the collective knowledge, post-mortems, and incident diagnoses for the TransferNest project. Its purpose is to prevent repeat mistakes and provide context for future development.

## Table of Contents (by Year)

### 2024
- [**PM-20240904-1000-sdk-conflict**](./entries/PM-20240904-1000-sdk-conflict.md) - TypeError due to `firebase-admin` SDK conflict in client-side code.
- [**PM-20240904-1001-build-error**](./entries/PM-20240904-1001-build-error.md) - Persistent build error from incorrect Genkit API route export syntax.
- [**PM-20240904-1002-data-contract**](./entries/PM-20240904-1002-data-contract.md) - Runtime fetch failure from data contract mismatch between Server Actions and Genkit flows.
- [**PM-20240904-1003-nesting-schema**](./entries/PM-20240904-1003-nesting-schema.md) - Schema validation error in nesting agent due to unhandled partial success states.
- [**PM-20240904-1005-rotation-bug**](./entries/PM-20240904-1005-rotation-bug.md) - Nesting agent fails to use rotation and creates invalid layouts.
- [**PM-20240905-1100-nesting-efficiency**](./entries/PM-20240905-1100-nesting-efficiency.md) - Suboptimal Nesting Due to Incomplete Strategy Competition.

## Index by Tags

- **genkit**: [PM-20240904-1001-build-error](./entries/PM-20240904-1001-build-error.md), [PM-20240904-1002-data-contract](./entries/PM-20240904-1002-data-contract.md), [PM-20240904-1003-nesting-schema](./entries/PM-20240904-1003-nesting-schema.md)
- **nextjs**: [PM-20240904-1000-sdk-conflict](./entries/PM-20240904-1000-sdk-conflict.md), [PM-20240904-1001-build-error](./entries/PM-20240904-1001-build-error.md)
- **firebase-admin**: [PM-20240904-1000-sdk-conflict](./entries/PM-20240904-1000-sdk-conflict.md)
- **server-actions**: [PM-20240904-1000-sdk-conflict](./entries/PM-20240904-1000-sdk-conflict.md), [PM-20240904-1002-data-contract](./entries/PM-20240904-1002-data-contract.md)
- **zod**: [PM-20240904-1003-nesting-schema](./entries/PM-20240904-1003-nesting-schema.md)
- **nesting**: [PM-20240904-1005-rotation-bug](./entries/PM-20240904-1005-rotation-bug.md), [PM-20240905-1100-nesting-efficiency](./entries/PM-20240905-1100-nesting-efficiency.md)
- **algorithm**: [PM-20240904-1005-rotation-bug](./entries/PM-20240904-1005-rotation-bug.md), [PM-20240905-1100-nesting-efficiency](./entries/PM-20240905-1100-nesting-efficiency.md)
- **bug**: [PM-20240904-1005-rotation-bug](./entries/PM-20240904-1005-rotation-bug.md)
- **efficiency**: [PM-20240905-1100-nesting-efficiency](./entries/PM-20240905-1100-nesting-efficiency.md)


## Index by Systems

- **genkit-api**: [PM-20240904-1001-build-error](./entries/PM-20240904-1001-build-error.md), [PM-20240904-1002-data-contract](./entries/PM-20240904-1002-data-contract.md)
- **actions**: [PM-20240904-1000-sdk-conflict](./entries/PM-20240904-1000-sdk-conflict.md), [PM-20240904-1002-data-contract](./entries/PM-20240904-1002-data-contract.md)
- **nesting-agent**: [PM-20240904-1003-nesting-schema](./entries/PM-20240904-1003-nesting-schema.md), [PM-20240904-1005-rotation-bug](./entries/PM-20240904-1005-rotation-bug.md), [PM-20240905-1100-nesting-efficiency](./entries/PM-20240905-1100-nesting-efficiency.md)
- **build-process**: [PM-20240904-1001-build-error](./entries/PM-20240904-1001-build-error.md)
- **data-schema**: [PM-20240904-1003-nesting-schema](./entries/PM-20240904-1003-nesting-schema.md), [PM-20240904-1005-rotation-bug](./entries/PM-20240904-1005-rotation-bug.md), [PM-20240905-1100-nesting-efficiency](./entries/PM-20240905-1100-nesting-efficiency.md)
