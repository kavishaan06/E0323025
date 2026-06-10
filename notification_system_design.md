# Stage 1: Notification System API & Real-Time Design

This document details the REST API contract, JSON schema structures, and real-time delivery mechanism for the Notification Platform.

---

## 1. REST API Endpoints Overview

The API is structured around RESTful resources under version control (`/api/v1`). All responses follow a standardized envelope structure.

| Method | Endpoint | Description | Auth Required |
|:---|:---|:---|:---|
| **POST** | `/api/v1/notifications` | Send/publish a new notification to a specific user. | Yes |
| **GET** | `/api/v1/notifications` | Retrieve a list of notifications for the authenticated user. | Yes |
| **PATCH** | `/api/v1/notifications/:id/status` | Mark a specific notification as read or unread. | Yes |
| **DELETE** | `/api/v1/notifications/:id` | Dismiss/delete a notification. | Yes |

---

## 2. API Contracts & Specifications

### 2.1 Send Notification (`POST /api/v1/notifications`)
Used by internal systems and microservices to send a notification to a specific recipient.

#### Headers
```http
Content-Type: application/json
Authorization: Bearer <access_token>
```

#### JSON Request Body
```json
{
  "recipientId": "usr_94a7e2b1",
  "title": "Placement Drive: Google APAC 2026",
  "message": "Applications are now open for the Software Engineer role. Deadline: June 30.",
  "type": "Placement",
  "priority": "high",
  "metadata": {
    "jobId": "job_google_001",
    "applyUrl": "https://careers.google.com"
  }
}
```

#### JSON Response (Success - `201 Created`)
```json
{
  "success": true,
  "data": {
    "id": "notif_7b8c2d91",
    "recipientId": "usr_94a7e2b1",
    "title": "Placement Drive: Google APAC 2026",
    "message": "Applications are now open for the Software Engineer role. Deadline: June 30.",
    "type": "Placement",
    "priority": "high",
    "status": "unread",
    "metadata": {
      "jobId": "job_google_001",
      "applyUrl": "https://careers.google.com"
    },
    "timestamp": "2026-06-10T05:30:00Z"
  }
}
```

#### JSON Response (Error - `400 Bad Request`)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Invalid fields present in the request body.",
    "details": [
      {
        "field": "type",
        "issue": "Must be one of: Placement, Result, Event"
      }
    ]
  }
}
```

---

### 2.2 Retrieve Notifications (`GET /api/v1/notifications`)
Retrieves notifications for the authenticated user. Supports filtering by notification type, read status, and cursor-based pagination.

#### Headers
```http
Accept: application/json
Authorization: Bearer <access_token>
```

#### Query Parameters
- `limit` (integer, default: 10): Number of notifications to return.
- `type` (string, optional): Filter by notification category (`Placement`, `Result`, `Event`).
- `status` (string, optional): Filter by status (`read`, `unread`).
- `cursor` (string, optional): Unique ID for pagination anchor.

#### JSON Response (Success - `200 OK`)
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notif_7b8c2d91",
        "title": "Placement Drive: Google APAC 2026",
        "message": "Applications are now open for the Software Engineer role. Deadline: June 30.",
        "type": "Placement",
        "priority": "high",
        "status": "unread",
        "metadata": {
          "jobId": "job_google_001",
          "applyUrl": "https://careers.google.com"
        },
        "timestamp": "2026-06-10T05:30:00Z"
      }
    ],
    "pagination": {
      "limit": 1,
      "nextCursor": "notif_7b8c2d91",
      "hasMore": false
    }
  }
}
```

---

### 2.3 Update Notification Status (`PATCH /api/v1/notifications/:id/status`)
Updates the status of a specific notification (e.g., marking it as read).

#### Headers
```http
Content-Type: application/json
Authorization: Bearer <access_token>
```

#### JSON Request Body
```json
{
  "status": "read"
}
```

#### JSON Response (Success - `200 OK`)
```json
{
  "success": true,
  "data": {
    "id": "notif_7b8c2d91",
    "status": "read",
    "updatedAt": "2026-06-10T05:32:15Z"
  }
}
```

---

### 2.4 Delete Notification (`DELETE /api/v1/notifications/:id`)
Dismisses and permanently deletes a specific notification.

#### Headers
```http
Authorization: Bearer <access_token>
```

#### JSON Response (Success - `200 OK`)
```json
{
  "success": true,
  "message": "Notification successfully dismissed."
}
```

---

## 3. JSON Schemas & Validation

### 3.1 Notification Object Schema
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Notification",
  "type": "object",
  "required": ["id", "recipientId", "title", "message", "type", "priority", "status", "timestamp"],
  "properties": {
    "id": {
      "type": "string",
      "description": "Unique identifier of the notification"
    },
    "recipientId": {
      "type": "string",
      "description": "Identifier of the target user"
    },
    "title": {
      "type": "string",
      "maxLength": 100,
      "description": "Short heading of the notification"
    },
    "message": {
      "type": "string",
      "maxLength": 1000,
      "description": "Main body text of the notification"
    },
    "type": {
      "type": "string",
      "enum": ["Placement", "Result", "Event"],
      "description": "Category of the notification"
    },
    "priority": {
      "type": "string",
      "enum": ["low", "medium", "high"],
      "description": "Urgency levels used for client rendering order"
    },
    "status": {
      "type": "string",
      "enum": ["read", "unread"],
      "description": "Current read status of the notification"
    },
    "metadata": {
      "type": "object",
      "description": "Dynamic structural payload containing extra links or contextual items"
    },
    "timestamp": {
      "type": "string",
      "format": "date-time",
      "description": "ISO 8601 UTC timestamp of creation"
    }
  }
}
```

---

## 4. Real-Time Notification Mechanism

To deliver real-time notifications to connected clients with high efficiency and minimal latency, the system utilizes **Server-Sent Events (SSE)**.

```mermaid
sequenceDiagram
    participant Client as Frontend Client
    participant Server as Notification API Server
    participant Redis as Message Broker (Pub/Sub)

    Client->>Server: GET /api/v1/notifications/stream (Headers: Authorization, Accept: text/event-stream)
    Note over Server: Authenticate token & establish persistent HTTP connection
    Server-->>Client: HTTP/1.1 200 OK (Content-Type: text/event-stream)
    
    Note over Client, Server: SSE Connection Established (unidirectional)

    critical Microservice publishes a notification
        Redis->>Server: Pub/Sub Event (New Notification details)
        Server->>Client: event: message\ndata: { "id": "notif_7b8...", "title": "Google APAC", ... }\n\n
    end
```

### 4.1 Server-Sent Events (SSE) Specification
Clients initiate a persistent connection through a standard HTTP request:

#### Request
```http
GET /api/v1/notifications/stream
Accept: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
Authorization: Bearer <access_token>
```

#### Response Headers
```http
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
Access-Control-Allow-Origin: *
```

#### Event Data Format
When a notification triggers, the server pushes a message over the connection:
```text
event: notification
data: {"id":"notif_7b8c2d91","title":"Placement Drive: Google APAC 2026","message":"Applications are now open.","type":"Placement","priority":"high","timestamp":"2026-06-10T05:30:00Z"}

event: heartbeat
data: {"time":"2026-06-10T05:31:00Z"}
```

### 4.2 Why Server-Sent Events (SSE) was Chosen Over WebSockets
1. **Unidirectional Simplicity**: Notifications flow purely from server-to-client. SSE is explicitly built for unidirectional streaming, avoiding the overhead of managing a full-duplex WebSocket connection.
2. **Standard HTTP Compatibility**: SSE operates over standard HTTP/HTTPS protocols, making it transparent to firewalls, API gateways, load balancers, and reverse proxies.
3. **Automatic Reconnection**: Browsers natively handle connection drops for SSE (`EventSource` API) and auto-reconnect with backoff. With WebSockets, this retry logic must be manually written.
4. **Multiplexing Support**: Over HTTP/2, SSE connections are multiplexed over a single TCP socket connection, mitigating the 6-connection browser limit per domain.
