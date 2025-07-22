module.exports = function (api) {
  api.cache(true);
  
  return {
    presets: [
      "babel-preset-expo", 
      "nativewind/babel"
    ],
    plugins: [
       
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@": "./",
            // Note: This alias for tailwind.config is often not needed with modern tooling
            "tailwind.config": "./tailwind.config.js"
          }
        }
      ],
      // This MUST be the last plugin
      "react-native-reanimated/plugin",
    ]
  };
};