# Linear Issue Template for Parallel Development Workflow

> **Template for writing Linear issues that work optimally with semantic analysis and parallel decomposition**

## 📋 Template Structure

```markdown
Title: [Action] [Technology/System] - [Key Capability/Feature]

Description:
1. [Infrastructure/Backend Task] - [Technology] [Action]
2. [Data/Storage Task] - [Technology] [Action]  
3. [API/Integration Task] - [Technology] [Action]
4. [Frontend/UI Task] - [Technology] [Action]
5. [Authentication/Security Task] - [Technology] [Action]
6. [Testing/Validation Task] - [Technology] [Action]
7. [Deployment/Configuration Task] - [Technology] [Action]

Acceptance Criteria:
- [Specific technical outcome 1]
- [Specific technical outcome 2]
- [Integration/performance requirement]
- [Testing requirement]

Technical Constraints:
- [Architecture requirement]
- [Technology stack requirement]
- [Performance requirement]
```

## ✅ Example: Well-Structured Issue

```markdown
Title: Enhanced Google Drive MCP Server - Full Write Capabilities

Description:
1. Implement MCP server integration layer using TypeScript
2. Create Google Drive API client with OAuth2 authentication
3. Add file upload/download operations with error handling
4. Implement storage sync functionality with conflict resolution
5. Build authentication system for Google Drive API access
6. Add comprehensive error handling and input validation
7. Create test suite covering all file operations
8. Add Docker deployment configuration with environment management

Acceptance Criteria:
- Google Drive operations (read/write/delete) work correctly
- MCP server starts without errors and handles requests
- File operations support common formats (docs, sheets, slides)
- Authentication integrates with existing OAuth system
- All tests pass with >90% coverage
- Docker container deploys successfully

Technical Constraints:
- Must use existing TypeScript/Node.js stack
- Integration with current MCP architecture
- OAuth2 flow compatible with existing auth system
- Support for large file uploads (>100MB)
```

## 🎯 Key Writing Guidelines

### **1. Use Numbered Lists (Critical)**
- System parses numbered requirements using regex: `/^\s*\d+\.\s*(.+)/`
- Each number becomes a separate requirement for analysis
- Without numbers, entire description becomes one requirement

### **2. Include Specific Technologies**
- **Good**: "React components", "Google Drive API", "MCP server", "Docker deployment"
- **Bad**: "UI components", "file system", "server", "deployment"

### **3. Use Action Verbs**
- **Preferred**: Implement, Create, Build, Add, Integrate, Enhance, Deploy
- **Semantic signals**: These words help categorize work complexity

### **4. Specify File Operations**
- **Create**: "Create new authentication module"
- **Modify**: "Update existing API endpoints"
- **Integrate**: "Integrate with current auth system"

### **5. Indicate Complexity Levels**
- **Basic**: "simple login form", "basic file upload"
- **Enhanced**: "OAuth2 integration", "conflict resolution"
- **Enterprise**: "SSO integration", "advanced security"

## 🤖 How Semantic Analysis Works

The system analyzes your issue to create intelligent parallel agents:

### **Domain Detection**
```javascript
// System looks for these patterns:
- Auth: "auth", "login", "oauth", "token", "authentication"
- API: "api", "endpoint", "server", "integration", "client"
- Data: "storage", "database", "sync", "crud", "persistence"
- UI: "component", "form", "interface", "frontend", "react"
- Infrastructure: "docker", "deploy", "configuration", "environment"
- Testing: "test", "validation", "coverage", "e2e"
```

### **Technology Recognition**
```javascript
// System recognizes these technologies:
- Frontend: "react", "vue", "angular", "next.js", "typescript"
- Backend: "node.js", "express", "fastapi", "django", "rails"
- Data: "postgres", "mongodb", "redis", "prisma", "supabase"
- Cloud: "aws", "gcp", "azure", "docker", "kubernetes"
- APIs: "rest", "graphql", "grpc", "webhook", "oauth"
```

### **Complexity Analysis**
```javascript
// System calculates effort based on:
- Action complexity: "implement" (high) vs "update" (medium)
- Technology complexity: "oauth2" (high) vs "basic auth" (low)
- Integration scope: "new system" (high) vs "existing component" (low)
```

## 📊 Agent Creation Logic

Based on your requirements, the system creates specialized agents:

### **Backend-Heavy Issues**
```markdown
1. Implement REST API endpoints
2. Add database schema and migrations
3. Create authentication middleware
4. Build file upload system
```
**Result**: `backend_api_agent`, `data_storage_agent`, `auth_agent`

### **Full-Stack Issues**
```markdown
1. Create React dashboard components
2. Implement GraphQL API backend
3. Add real-time WebSocket features
4. Build authentication system
```
**Result**: `frontend_ui_agent`, `backend_api_agent`, `realtime_agent`, `auth_agent`

### **Infrastructure-Heavy Issues**
```markdown
1. Add Docker containerization
2. Implement CI/CD pipeline
3. Create monitoring and logging
4. Add deployment automation
```
**Result**: `infrastructure_agent`, `deployment_agent`, `monitoring_agent`

## ❌ Common Mistakes to Avoid

### **Poorly Structured Issue**
```markdown
Add user authentication to the app with forms and API integration and testing
```
**Problems**: No numbering, vague requirements, mixed complexity

### **Missing Technology Specifics**
```markdown
1. Create user interface
2. Add backend functionality  
3. Implement data storage
```
**Problems**: No tech stack specified, unclear implementation requirements

### **Overly Complex Single Requirements**
```markdown
1. Implement comprehensive user management system with authentication, authorization, password reset, email verification, role-based access control, audit logging, and social login integration
```
**Problems**: Multiple complex features in one requirement, should be broken down

## ✅ Best Practices

### **1. Progressive Complexity**
```markdown
1. Create basic authentication system (30 min)
2. Add OAuth2 integration (45 min)
3. Implement role-based permissions (60 min)
```

### **2. Clear Dependencies**
```markdown
1. Set up database schema and models
2. Create API endpoints using the models
3. Build frontend forms that call the APIs
```

### **3. Testable Outcomes**
```markdown
1. Implement file upload API with validation
2. Add comprehensive test suite for upload operations
3. Create frontend components with error handling
```

## 🚀 Quick Reference Checklist

Before submitting your Linear issue, ensure:

- [ ] **Numbered requirements** (1., 2., 3., etc.)
- [ ] **Specific technologies** mentioned (React, Node.js, Docker)
- [ ] **Clear action verbs** (Implement, Create, Add, Build)
- [ ] **File operation types** specified (create, modify, integrate)
- [ ] **Acceptance criteria** defined with technical outcomes
- [ ] **Technology constraints** noted if applicable
- [ ] **Complexity appropriate** for parallel decomposition (2-6 requirements)

## 💡 Pro Tips

### **For Maximum Parallelization**
- Structure requirements by domain (backend → data → frontend → testing)
- Use specific technology terms the system recognizes
- Include both creation and integration tasks
- Specify testing requirements separately

### **For Complex Features**
- Break into 4-6 numbered requirements maximum
- Each requirement should be 30-60 minutes of work
- Lead with infrastructure, end with testing
- Include deployment/configuration as final step

This template ensures your Linear issues work optimally with the parallel development workflow's semantic analysis engine.