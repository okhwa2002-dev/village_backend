# File Upload And Output Flow

## Overview

Files are managed through a common file module. Business domains, such as village content, connect to files through `fileGroupId`.

The common file flow is:

```text
business table.file_group_id -> file_groups.id -> files[]
```

For village content:

```text
village_content.file_group_id -> file_groups.id -> files.file_group_id
```

## Storage Configuration

Upload behavior is controlled by environment variables.

```env
UPLOAD_DIR=D:\attach\
UPLOAD_PATH_PREFIX=uploads
FILE_URL_PREFIX=/files
MULTIPART_FILE_SIZE_LIMIT_BYTES=10485760
MULTIPART_FILES_LIMIT=10
```

Meaning:

```text
Actual file path: D:\attach\village\abc.jpg
DB file_path: uploads/village/abc.jpg
DB file_url: /files/village/abc.jpg
Public URL: http://localhost:3000/files/village/abc.jpg
```

## Common File Tables

`file_groups` stores one file group per business entity or upload context.

```text
file_groups
- id
- ref_type
- created_at
- created_by
```

`files` stores file metadata.

```text
files
- id
- file_group_id
- original_name
- stored_name
- file_path
- file_url
- mime_type
- file_size
- storage_type
- sort_order
- is_main_yn
```

## Common File Upload API

Create a file group:

```text
POST /api/file-groups
```

Body:

```json
{
  "refType": "VILLAGE"
}
```

Upload files:

```text
POST /api/files
multipart/form-data
```

Fields:

```text
fileGroupId: 1
files: a.jpg
files: b.jpg
mainIndex: 0
sortStartOrder: 0
```

## Village Content Upload

Village content supports both JSON requests and multipart requests.

```text
POST /api/admin/village
PUT /api/admin/village/:id
```

Multipart example:

```text
section: intro
title: 마을 소개
body: 소개 내용
publishedYn: Y
files: image1.jpg
files: image2.jpg
mainIndex: 0
```

Flow:

```text
villageController
-> multipartParser
-> villageService
-> fileService.createGroup("VILLAGE")
-> fileService.uploadFiles()
-> village_content.file_group_id
```

On update, if the content already has a `fileGroupId`, new files are added to that group. If no group exists, a new `VILLAGE` file group is created and connected.

## File Output

Static files are served through Fastify static.

```ts
app.register(staticFiles, {
  root: uploadRoot,
  prefix: fileUrlPrefix,
});
```

If `files.file_url` is:

```text
/files/village/abc.jpg
```

Frontend usage:

```tsx
<img src={`${API_BASE_URL}${file.fileUrl}`} alt={file.originalName} />
```

## Village Content Response

Village content APIs include file data.

```text
GET /api/village
GET /api/village/:section
GET /api/admin/village
```

Response example:

```json
{
  "id": "1",
  "section": "intro",
  "title": "마을 소개",
  "fileGroupId": "10",
  "imageUrl": "/files/village/main.jpg",
  "files": [
    {
      "id": "100",
      "originalName": "main.jpg",
      "fileUrl": "/files/village/main.jpg",
      "sortOrder": 0,
      "isMainYn": "Y"
    },
    {
      "id": "101",
      "originalName": "sub.jpg",
      "fileUrl": "/files/village/sub.jpg",
      "sortOrder": 1,
      "isMainYn": "N"
    }
  ]
}
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

`imageUrl` remains as a main-image compatibility field. New multi-image UIs should use `files`.
