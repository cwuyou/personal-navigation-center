// 多语言配置文件
export type Language = 'zh' | 'en'

export interface Translations {
  // 通用
  common: {
    save: string
    cancel: string
    delete: string
    edit: string
    add: string
    search: string
    loading: string
    success: string
    error: string
    confirm: string
    back: string
    next: string
    previous: string
    close: string
    open: string
    copy: string
    move: string
    import: string
    export: string
    settings: string
    help: string
    about: string
    language: string
  }
  
  // 导航和标题
  nav: {
    title: string
    subtitle: string
    dashboard: string
    bookmarks: string
    categories: string
    analytics: string
  }

  // 首页专用
  homepage: {
    title: string
    subtitle: string
    description: string
    heroTitle: string
    heroSubtitle: string
    quickStart: string
    learnMore: string
    enterApp: string
    bookmarkManager: string
    whyChoose: string
    whyDescription: string
    features: {
      free: string
      privacy: string
      responsive: string
    }
  }
  
  // 书签相关
  bookmark: {
    title: string
    url: string
    description: string
    category: string
    subCategory: string
    addBookmark: string
    editBookmark: string
    deleteBookmark: string
    moveBookmark: string
    bookmarkAdded: string
    bookmarkUpdated: string
    bookmarkDeleted: string
    noBookmarks: string
    searchBookmarks: string
    visitWebsite: string
    copyUrl: string
    openInNewTab: string
  }
  
  // 分类相关
  category: {
    name: string
    addCategory: string
    editCategory: string
    deleteCategory: string
    addSubCategory: string
    categoryAdded: string
    categoryUpdated: string
    categoryDeleted: string
    subCategoryAdded: string
    defaultCategory: string
    uncategorized: string
    selectCategory: string
    selectSubCategory: string
  }
  
  // 导入导出
  importExport: {
    importBookmarks: string
    exportBookmarks: string
    importFromFile: string
    exportToFile: string
    selectFile: string
    fileFormat: string
    htmlFormat: string
    jsonFormat: string
    importSuccess: string
    exportSuccess: string
    importError: string
    exportError: string
    dragDropFile: string
    supportedFormats: string
  }
  
  // 设置
  settings: {
    title: string
    theme: string
    language: string
    display: string
    storage: string
    privacy: string
    about: string
    version: string
    lightTheme: string
    darkTheme: string
    systemTheme: string
    gridView: string
    listView: string
    compactView: string
    showDescriptions: string
    showIcons: string
    autoEnhancement: string
  }
  
  // 搜索
  search: {
    placeholder: string
    noResults: string
    searchIn: string
    allCategories: string
    currentCategory: string
    searchResults: string
    clearSearch: string
  }
  
  // 错误和提示
  messages: {
    confirmDelete: string
    confirmDeleteCategory: string
    unsavedChanges: string
    networkError: string
    invalidUrl: string
    requiredField: string
    maxLength: string
    minLength: string
    duplicateBookmark: string
    categoryNotEmpty: string
  }
  
  // 帮助和指南
  help: {
    title: string
    gettingStarted: string
    addingBookmarks: string
    organizingCategories: string
    importingData: string
    shortcuts: string
    troubleshooting: string
    contact: string
  }
}

// 中文翻译
export const zhTranslations: Translations = {
  common: {
    save: '保存',
    cancel: '取消',
    delete: '删除',
    edit: '编辑',
    add: '添加',
    search: '搜索',
    loading: '加载中...',
    success: '成功',
    error: '错误',
    confirm: '确认',
    back: '返回',
    next: '下一步',
    previous: '上一步',
    close: '关闭',
    open: '打开',
    copy: '复制',
    move: '移动',
    import: '导入',
    export: '导出',
    settings: '设置',
    help: '帮助',
    about: '关于',
    language: '语言'
  },
  
  nav: {
    title: '个人导航中心',
    subtitle: '您的专属书签管理平台',
    dashboard: '仪表板',
    bookmarks: '书签',
    categories: '分类',
    analytics: '统计'
  },

  homepage: {
    title: '个人导航中心',
    subtitle: '您的专属书签管理平台',
    description: '将浏览器起始页转换为强大的导航中心，智能管理书签，打造专属个人主页',
    heroTitle: '打造完美的个人主页',
    heroSubtitle: '智能管理书签，快速访问常用网站',
    quickStart: '开始使用',
    learnMore: '了解更多',
    enterApp: '进入应用',
    bookmarkManager: '书签管理',
    whyChoose: '为什么选择 My Homepage？',
    whyDescription: '个人主页和起始页的完美解决方案，专为现代用户设计，无论是学生、上班族，还是数字游民，都能完美适配您的浏览习惯，让您的网络生活更加高效便捷。',
    features: {
      free: '完全免费',
      privacy: '隐私保护',
      responsive: '响应式设计'
    }
  },
  
  bookmark: {
    title: '标题',
    url: '网址',
    description: '描述',
    category: '分类',
    subCategory: '子分类',
    addBookmark: '添加书签',
    editBookmark: '编辑书签',
    deleteBookmark: '删除书签',
    moveBookmark: '移动书签',
    bookmarkAdded: '书签已添加',
    bookmarkUpdated: '书签已更新',
    bookmarkDeleted: '书签已删除',
    noBookmarks: '暂无书签',
    searchBookmarks: '搜索书签',
    visitWebsite: '访问网站',
    copyUrl: '复制链接',
    openInNewTab: '新标签页打开'
  },
  
  category: {
    name: '分类名称',
    addCategory: '添加分类',
    editCategory: '编辑分类',
    deleteCategory: '删除分类',
    addSubCategory: '添加子分类',
    categoryAdded: '分类已添加',
    categoryUpdated: '分类已更新',
    categoryDeleted: '分类已删除',
    subCategoryAdded: '子分类已添加',
    defaultCategory: '默认分类',
    uncategorized: '未分类',
    selectCategory: '选择分类',
    selectSubCategory: '选择子分类'
  },
  
  importExport: {
    importBookmarks: '导入书签',
    exportBookmarks: '导出书签',
    importFromFile: '从文件导入',
    exportToFile: '导出到文件',
    selectFile: '选择文件',
    fileFormat: '文件格式',
    htmlFormat: 'HTML格式',
    jsonFormat: 'JSON格式',
    importSuccess: '导入成功',
    exportSuccess: '导出成功',
    importError: '导入失败',
    exportError: '导出失败',
    dragDropFile: '拖拽文件到此处',
    supportedFormats: '支持的格式'
  },
  
  settings: {
    title: '设置',
    theme: '主题',
    language: '语言',
    display: '显示',
    storage: '存储',
    privacy: '隐私',
    about: '关于',
    version: '版本',
    lightTheme: '浅色主题',
    darkTheme: '深色主题',
    systemTheme: '跟随系统',
    gridView: '网格视图',
    listView: '列表视图',
    compactView: '紧凑视图',
    showDescriptions: '显示描述',
    showIcons: '显示图标',
    autoEnhancement: '自动增强'
  },
  
  search: {
    placeholder: '搜索书签...',
    noResults: '未找到相关结果',
    searchIn: '搜索范围',
    allCategories: '所有分类',
    currentCategory: '当前分类',
    searchResults: '搜索结果',
    clearSearch: '清除搜索'
  },
  
  messages: {
    confirmDelete: '确定要删除这个书签吗？',
    confirmDeleteCategory: '确定要删除这个分类吗？此操作将同时删除分类下的所有书签。',
    unsavedChanges: '您有未保存的更改，确定要离开吗？',
    networkError: '网络连接错误，请稍后重试',
    invalidUrl: '请输入有效的网址',
    requiredField: '此字段为必填项',
    maxLength: '内容过长',
    minLength: '内容过短',
    duplicateBookmark: '该书签已存在',
    categoryNotEmpty: '分类不为空，无法删除'
  },
  
  help: {
    title: '帮助中心',
    gettingStarted: '快速开始',
    addingBookmarks: '添加书签',
    organizingCategories: '管理分类',
    importingData: '导入数据',
    shortcuts: '快捷键',
    troubleshooting: '故障排除',
    contact: '联系我们'
  }
}

// 英文翻译
export const enTranslations: Translations = {
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    search: 'Search',
    loading: 'Loading...',
    success: 'Success',
    error: 'Error',
    confirm: 'Confirm',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    close: 'Close',
    open: 'Open',
    copy: 'Copy',
    move: 'Move',
    import: 'Import',
    export: 'Export',
    settings: 'Settings',
    help: 'Help',
    about: 'About',
    language: 'Language'
  },

  nav: {
    title: 'Personal Navigation Center',
    subtitle: 'Your Personal Bookmark Management Platform',
    dashboard: 'Dashboard',
    bookmarks: 'Bookmarks',
    categories: 'Categories',
    analytics: 'Analytics'
  },

  homepage: {
    title: 'Personal Navigation Center',
    subtitle: 'Your Personal Bookmark Management Platform',
    description: 'Transform your browser start page into a powerful navigation center, manage bookmarks intelligently, and build your custom personal homepage',
    heroTitle: 'Create Your Perfect Personal Homepage',
    heroSubtitle: 'Manage bookmarks intelligently and access your favorite websites quickly',
    quickStart: 'Get Started',
    learnMore: 'Learn More',
    enterApp: 'Enter App',
    bookmarkManager: 'Bookmark Manager',
    whyChoose: 'Why Choose My Homepage?',
    whyDescription: 'The perfect solution for personal homepage and start page, designed for modern users. Whether you are a student, office worker, or digital nomad, it perfectly adapts to your browsing habits and makes your online life more efficient and convenient.',
    features: {
      free: 'Completely Free',
      privacy: 'Privacy Protected',
      responsive: 'Responsive Design'
    }
  },

  bookmark: {
    title: 'Title',
    url: 'URL',
    description: 'Description',
    category: 'Category',
    subCategory: 'Subcategory',
    addBookmark: 'Add Bookmark',
    editBookmark: 'Edit Bookmark',
    deleteBookmark: 'Delete Bookmark',
    moveBookmark: 'Move Bookmark',
    bookmarkAdded: 'Bookmark Added',
    bookmarkUpdated: 'Bookmark Updated',
    bookmarkDeleted: 'Bookmark Deleted',
    noBookmarks: 'No Bookmarks',
    searchBookmarks: 'Search Bookmarks',
    visitWebsite: 'Visit Website',
    copyUrl: 'Copy URL',
    openInNewTab: 'Open in New Tab'
  },

  category: {
    name: 'Category Name',
    addCategory: 'Add Category',
    editCategory: 'Edit Category',
    deleteCategory: 'Delete Category',
    addSubCategory: 'Add Subcategory',
    categoryAdded: 'Category Added',
    categoryUpdated: 'Category Updated',
    categoryDeleted: 'Category Deleted',
    subCategoryAdded: 'Subcategory Added',
    defaultCategory: 'Default Category',
    uncategorized: 'Uncategorized',
    selectCategory: 'Select Category',
    selectSubCategory: 'Select Subcategory'
  },

  importExport: {
    importBookmarks: 'Import Bookmarks',
    exportBookmarks: 'Export Bookmarks',
    importFromFile: 'Import from File',
    exportToFile: 'Export to File',
    selectFile: 'Select File',
    fileFormat: 'File Format',
    htmlFormat: 'HTML Format',
    jsonFormat: 'JSON Format',
    importSuccess: 'Import Successful',
    exportSuccess: 'Export Successful',
    importError: 'Import Failed',
    exportError: 'Export Failed',
    dragDropFile: 'Drag and drop file here',
    supportedFormats: 'Supported Formats'
  },

  settings: {
    title: 'Settings',
    theme: 'Theme',
    language: 'Language',
    display: 'Display',
    storage: 'Storage',
    privacy: 'Privacy',
    about: 'About',
    version: 'Version',
    lightTheme: 'Light Theme',
    darkTheme: 'Dark Theme',
    systemTheme: 'System Theme',
    gridView: 'Grid View',
    listView: 'List View',
    compactView: 'Compact View',
    showDescriptions: 'Show Descriptions',
    showIcons: 'Show Icons',
    autoEnhancement: 'Auto Enhancement'
  },

  search: {
    placeholder: 'Search bookmarks...',
    noResults: 'No results found',
    searchIn: 'Search in',
    allCategories: 'All Categories',
    currentCategory: 'Current Category',
    searchResults: 'Search Results',
    clearSearch: 'Clear Search'
  },

  messages: {
    confirmDelete: 'Are you sure you want to delete this bookmark?',
    confirmDeleteCategory: 'Are you sure you want to delete this category? This will also delete all bookmarks in this category.',
    unsavedChanges: 'You have unsaved changes. Are you sure you want to leave?',
    networkError: 'Network connection error. Please try again later.',
    invalidUrl: 'Please enter a valid URL',
    requiredField: 'This field is required',
    maxLength: 'Content is too long',
    minLength: 'Content is too short',
    duplicateBookmark: 'This bookmark already exists',
    categoryNotEmpty: 'Category is not empty and cannot be deleted'
  },

  help: {
    title: 'Help Center',
    gettingStarted: 'Getting Started',
    addingBookmarks: 'Adding Bookmarks',
    organizingCategories: 'Organizing Categories',
    importingData: 'Importing Data',
    shortcuts: 'Keyboard Shortcuts',
    troubleshooting: 'Troubleshooting',
    contact: 'Contact Us'
  }
}

// 语言配置
export const languages = {
  zh: zhTranslations,
  en: enTranslations
}

// 默认语言
export const defaultLanguage: Language = 'zh'

// 获取浏览器语言
export const getBrowserLanguage = (): Language => {
  if (typeof window === 'undefined') return defaultLanguage

  const browserLang = navigator.language.toLowerCase()
  if (browserLang.startsWith('en')) return 'en'
  if (browserLang.startsWith('zh')) return 'zh'

  return defaultLanguage
}

// 语言显示名称
export const languageNames = {
  zh: '中文',
  en: 'English'
}
