

  if (config.authType === AuthType.QWEN_WEB) {
    const { QwenWebContentGenerator } = await import('./qwenWebContentGenerator.js');
    return new QwenWebContentGenerator(gcConfig, config);
  }

  throw new Error(
    `Error creating contentGenerator: Unsupported authType: ${config.authType}`,
  );
}
