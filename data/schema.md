# Project HQ Data Schema

Bu dosya `project-hq.json` veri yapisini dokumante eder.

## Meta
```json
{
  "meta": {
    "projectName": "string",
    "version": "string (semver)",
    "updatedAt": "ISO 8601 datetime",
    "description": "string"
  }
}
```

## Overview
```json
{
  "overview": {
    "status": "string (e.g., Beta, Production)",
    "currentVersion": "string",
    "currentBuild": "string",
    "activeBranch": "string",
    "environments": [
      {
        "name": "string (Preview/Production)",
        "url": "string",
        "status": "active|pending|inactive"
      }
    ],
    "releaseReadiness": "number (0-100)",
    "blockers": [
      {
        "id": "string",
        "title": "string",
        "priority": "P0|P1|P2|P3",
        "status": "Open|Resolved"
      }
    ],
    "quickLinks": [
      {
        "title": "string",
        "url": "string",
        "icon": "string (optional)"
      }
    ],
    "recentChanges": ["string"]
  }
}
```

## Product
```json
{
  "product": {
    "summary": "string",
    "targetUsers": [
      {
        "role": "string",
        "description": "string"
      }
    ],
    "modules": [
      {
        "name": "string",
        "description": "string",
        "screens": ["string"]
      }
    ],
    "flows": [
      {
        "name": "string",
        "steps": ["string"]
      }
    ]
  }
}
```

## Roles
```json
{
  "roles": {
    "accountModel": "string",
    "roles": [
      {
        "name": "string",
        "description": "string"
      }
    ],
    "permissionsMatrix": [
      {
        "resource": "string",
        "role_name": "boolean",
        ...
      }
    ],
    "visibility": {
      "key": "description"
    }
  }
}
```

## Architecture
```json
{
  "architecture": {
    "overview": "string",
    "directories": [
      {
        "path": "string",
        "description": "string"
      }
    ],
    "frontendBackendBoundary": "string",
    "offlineSupport": "string",
    "observability": {
      "errorTracking": "string",
      "analytics": "string",
      "crashReporting": "string",
      "diagnostics": "string"
    }
  }
}
```

## Tech
```json
{
  "tech": {
    "stack": [
      {
        "name": "string",
        "version": "string",
        "notes": "string"
      }
    ],
    "sdks": [
      {
        "name": "string",
        "purpose": "string"
      }
    ],
    "envKeys": ["string (env variable names only, no values)"]
  }
}
```

## Firebase
```json
{
  "firebase": {
    "projectId": "string",
    "collections": [
      {
        "name": "string",
        "description": "string",
        "indexes": ["string"]
      }
    ],
    "rulesNotes": "string",
    "indexes": ["string"],
    "commonErrors": [
      {
        "code": "string",
        "cause": "string",
        "fix": "string"
      }
    ],
    "featureFlags": [
      {
        "key": "string",
        "description": "string",
        "default": "boolean"
      }
    ],
    "debugRecipes": [
      {
        "name": "string",
        "steps": ["string"]
      }
    ]
  }
}
```

## Payments
```json
{
  "payments": {
    "provider": "string",
    "environment": "sandbox|production",
    "flow": [
      {
        "step": "number",
        "action": "string",
        "endpoint": "string"
      }
    ],
    "plans": [
      {
        "name": "string",
        "price": "number",
        "features": ["string"],
        "commission": "string"
      }
    ],
    "riskNotes": ["string"],
    "testCards": [
      {
        "type": "string",
        "number": "string",
        "expiry": "string",
        "cvv": "string"
      }
    ]
  }
}
```

## Admin Portal
```json
{
  "adminPortal": {
    "framework": "string",
    "routes": [
      {
        "path": "string",
        "description": "string"
      }
    ],
    "permissions": ["string"],
    "supportOperations": ["string"]
  }
}
```

## QA
```json
{
  "qa": {
    "legacyReportPath": "string (relative path)",
    "screenshotFolders": ["string"],
    "testDevices": [
      {
        "name": "string",
        "os": "string",
        "resolution": "string"
      }
    ],
    "testCases": [
      {
        "id": "string",
        "category": "string",
        "title": "string",
        "steps": ["string"],
        "expected": "string",
        "priority": "P0|P1|P2"
      }
    ],
    "releaseChecklist": [
      {
        "item": "string",
        "status": "pending|done|in-progress"
      }
    ]
  }
}
```

## Issues
```json
{
  "issues": [
    {
      "id": "string (ISS-XXXX)",
      "title": "string",
      "type": "Bug|Enhancement|Task",
      "severity": "High|Medium|Low",
      "priority": "P0|P1|P2|P3",
      "status": "Backlog|Todo|In Progress|Done",
      "area": "string",
      "screen": "string",
      "description": "string",
      "rootCause": "string",
      "fixApproach": "string",
      "files": ["string"],
      "assignee": "string",
      "sprintId": "string",
      "createdAt": "date string",
      "updatedAt": "date string"
    }
  ]
}
```

## Sprints
```json
{
  "sprints": [
    {
      "id": "string (SPRINT-XXX)",
      "name": "string",
      "goal": "string",
      "startDate": "date string",
      "endDate": "date string",
      "status": "Planning|Active|Completed",
      "issueIds": ["string"],
      "dod": [
        {
          "text": "string",
          "done": "boolean"
        }
      ],
      "risks": [
        {
          "description": "string",
          "mitigation": "string"
        }
      ]
    }
  ]
}
```

## Builds
```json
{
  "builds": [
    {
      "id": "string (BUILD-XXX)",
      "buildNumber": "string",
      "version": "string",
      "channel": "TestFlight|Internal Testing|Production",
      "platform": "iOS|Android",
      "runtimeVersion": "string",
      "gitCommit": "string",
      "gitBranch": "string",
      "date": "date string",
      "expiresAt": "date string (optional)",
      "notes": "string",
      "knownIssueIds": ["string"],
      "status": "Building|Submitted|Available|Rejected",
      "downloadUrl": "string"
    }
  ]
}
```

## Compliance
```json
{
  "compliance": {
    "apple": {
      "appStoreStatus": "string",
      "lastReviewDate": "date string",
      "checklist": [
        {
          "id": "string",
          "item": "string",
          "status": "pending|done|in-progress|blocked",
          "notes": "string"
        }
      ],
      "privacyNutritionLabels": [
        {
          "category": "string",
          "collected": "boolean",
          "purpose": "string",
          "linked": "boolean"
        }
      ]
    },
    "googlePlay": {
      "playStoreStatus": "string",
      "lastReviewDate": "date string",
      "checklist": [
        {
          "id": "string",
          "item": "string",
          "status": "pending|done|in-progress|blocked",
          "notes": "string"
        }
      ],
      "dataSafetyForm": {
        "dataCollected": ["string"],
        "dataShared": ["string"],
        "securityPractices": ["string"]
      }
    },
    "rejections": [
      {
        "date": "date string",
        "store": "Apple|Google",
        "reason": "string",
        "fix": "string",
        "status": "Pending|Fixed"
      }
    ]
  }
}
```

## Links
```json
{
  "links": [
    {
      "id": "string (LINK-XXX)",
      "title": "string",
      "url": "string",
      "category": "Repository|Infrastructure|Design|Documentation|Distribution|Other",
      "type": "external|local",
      "owner": "string",
      "notes": "string",
      "lastUpdated": "date string"
    }
  ]
}
```

## Changelog
```json
{
  "changelog": [
    {
      "id": "string (CL-XXX)",
      "date": "date string",
      "version": "string",
      "title": "string",
      "description": "string",
      "changes": ["string"],
      "issueIds": ["string"]
    }
  ]
}
```

---

## Notlar

1. Tum tarihler ISO 8601 formatinda veya `YYYY-MM-DD` seklinde saklanir.
2. ID'ler belirli bir formati takip eder: `ISS-0001`, `SPRINT-001`, `BUILD-001`, vb.
3. Status alanlari onceden tanimli degerler kullanir (enum benzeri).
4. Hassas bilgiler (API keys, secrets) bu dosyada SAKLANMAZ.
5. JSON dosyasi localStorage'a kaydedilir ve export/import ile yedeklenir.
