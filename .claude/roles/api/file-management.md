# File API Rules

## Purpose

Use this rule when implementing or consuming APIs that upload, connect, list, or display files.

Files are managed by the common file module. Business APIs should not duplicate file storage logic.

```text
business table.file_group_id -> file_groups.id -> files[]
```

## Common Responsibilities

The common file layer owns:

- File group creation
- Multipart file parsing helpers
- File storage
- File metadata creation
- File list lookup by `fileGroupId`
- Main file handling through `isMainYn`
- Sort order handling through `sortOrder`
- Static file output through `fileUrl`

Business domains own:

- Deciding the `refType`
- Connecting `fileGroupId` to the business record
- Returning file data with the business response when needed
- Choosing whether the API supports JSON only or JSON plus multipart

## Environment Rules

Upload configuration is environment-driven.

```env
UPLOAD_DIR=D:\attach\
UPLOAD_PATH_PREFIX=uploads
FILE_URL_PREFIX=/files
MULTIPART_FILE_SIZE_LIMIT_BYTES=10485760
MULTIPART_FILES_LIMIT=10
```

Do not store absolute local disk paths in the database.

Use this shape:

```text
Actual file path: D:\attach\village\abc.jpg
DB file_path: uploads/village/abc.jpg
DB file_url: /files/village/abc.jpg
Public URL: http://localhost:3000/files/village/abc.jpg
```

## Common File APIs

Create a file group:

```text
POST /api/file-groups
Content-Type: application/json
Authorization: Bearer <accessToken>
```

Body:

```json
{
  "refType": "VILLAGE"
}
```

Upload one or more files:

```text
POST /api/files
Content-Type: multipart/form-data
Authorization: Bearer <accessToken>
```

Fields:

```text
fileGroupId: 1
files: a.jpg
files: b.jpg
mainIndex: 0
sortStartOrder: 0
```

Single-file compatibility is allowed with `file`.

```text
fileGroupId: 1
file: a.jpg
isMainYn: Y
sortOrder: 0
```

List files in a group:

```text
GET /api/file-groups/:id/files
```

Update file metadata:

```text
PATCH /api/files/:id
```

Body:

```json
{
  "sortOrder": 1,
  "isMainYn": "Y"
}
```

Delete a file:

```text
DELETE /api/files/:id
```

## Business API Pattern

When a business API needs file upload in the same request, support `multipart/form-data` and call the common file service.

Example flow:

```text
Controller
-> parseMultipartWithFiles(req)
-> Convert fields to business DTO
-> Business service
-> fileService.createGroup(refType, userId) when needed
-> fileService.uploadFiles(...)
-> Save business record with fileGroupId
```

On update:

- If the business record already has `fileGroupId`, add files to that group.
- If it has no `fileGroupId`, create a new file group and connect it.
- If `mainIndex` is passed, use it to select the main file among newly uploaded files.

## Village API Pattern

Village content supports both JSON and multipart requests.

```text
POST /api/admin/village
PUT /api/admin/village/:id
```

Multipart fields:

```text
section: intro
title: Village intro
body: Intro body
publishedYn: Y
files: image1.jpg
files: image2.jpg
mainIndex: 0
```

Village content responses should include:

- `fileGroupId`
- `imageUrl` for main-image compatibility
- `files[]` for multi-image UI

Response example:

```json
{
  "id": "1",
  "section": "intro",
  "title": "Village intro",
  "fileGroupId": "10",
  "imageUrl": "/files/village/main.jpg",
  "files": [
    {
      "id": "100",
      "originalName": "main.jpg",
      "fileUrl": "/files/village/main.jpg",
      "sortOrder": 0,
      "isMainYn": "Y"
    }
  ]
}
```

## Frontend Output Rule

The frontend should use `fileUrl` with the backend base URL.

```tsx
<img src={`${API_BASE_URL}${file.fileUrl}`} alt={file.originalName} />
```

For multiple images, use `files`.

```tsx
{content.files.map((file) => (
  <img
    key={file.id}
    src={`${API_BASE_URL}${file.fileUrl}`}
    alt={file.originalName}
  />
))}
```

Use `imageUrl` only for legacy or single-main-image screens.

## Error Handling

Controller should convert service error codes to HTTP responses.

Recommended mappings:

| Error | HTTP |
| --- | --- |
| `FILE_GROUP_NOT_FOUND` | 404 |
| `FILE_NOT_FOUND` | 404 |
| `FILE_REQUIRED` | 400 |
| `INVALID_MAIN_INDEX` | 400 |
| `INVALID_REF_TYPE` | 400 |
| `STORAGE_DISK_FULL` | 500 |
| `STORAGE_PERMISSION_DENIED` | 500 |
| `STORAGE_WRITE_FAILED` | 500 |

Do not expose local absolute paths or storage internals to clients.
