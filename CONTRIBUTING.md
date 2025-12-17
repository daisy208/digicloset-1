# Contributing to VirtualFit Enterprise

Thank you for your interest in contributing to VirtualFit Enterprise! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js 18 or higher
- npm or yarn
- Git

### Development Setup

1. **Fork the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/virtualfit-enterprise.git
   cd virtualfit-enterprise
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 📝 Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow existing code formatting (Prettier configuration)
- Use meaningful variable and function names
- Add comments for complex logic

### Component Structure
- Keep components focused and single-purpose
- Use proper TypeScript interfaces
- Follow the existing file organization pattern
- Ensure components are responsive and accessible

### Commit Messages
Use conventional commit format:
```
feat: add new virtual try-on feature
fix: resolve lighting adjustment bug
docs: update API documentation
style: improve button hover states
refactor: optimize image loading
test: add unit tests for AI preferences
```

## 🧪 Testing

### Running Tests
```bash
npm run test
```

### Writing Tests
- Write unit tests for utility functions
- Add integration tests for complex components
- Ensure new features have adequate test coverage

## 📋 Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new functionality
3. **Ensure all tests pass**
4. **Update the README** if you've added features
5. **Create a detailed pull request description**

### Pull Request Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] Added new tests
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots for UI changes
```

## 🐛 Bug Reports

When reporting bugs, please include:
- **Environment details** (OS, browser, Node.js version)
- **Steps to reproduce** the issue
- **Expected behavior**
- **Actual behavior**
- **Screenshots** if applicable

## 💡 Feature Requests

For feature requests, please provide:
- **Use case description**
- **Proposed solution**
- **Alternative solutions considered**
- **Additional context**

## 📚 Documentation

- Keep README.md updated
- Document new APIs and components
- Add inline code comments
- Update type definitions

## 🏗️ Architecture Guidelines

### File Organization
```
src/
├── components/     # Reusable UI components
├── pages/         # Route components
├── hooks/         # Custom React hooks
├── types/         # TypeScript definitions
├── utils/         # Utility functions
└── styles/        # Global styles
```

### State Management
- Use React hooks for local state
- Consider context for shared state
- Keep state as close to usage as possible

### Performance
- Optimize images and assets
- Use lazy loading where appropriate
- Minimize bundle size
- Follow React performance best practices

## 🤝 Community

- Be respectful and inclusive
- Help others learn and grow
- Share knowledge and best practices
- Follow the code of conduct

## 📞 Getting Help

- **Issues**: Create a GitHub issue
- **Discussions**: Use GitHub Discussions
- **Email**: contribute@virtualfit.com

Thank you for contributing to VirtualFit Enterprise! 🎉