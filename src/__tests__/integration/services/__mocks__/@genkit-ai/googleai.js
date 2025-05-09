const googleAI = () => ({
  name: 'googleai',
  initializer: () => {
    return {
      generateContent: async () => ({
        response: {
          candidates: [{
            content: {
              parts: [{
                text: 'Generated optimized prompt content'
              }]
            }
          }]
        }
      }),
    };
  },
});

module.exports = { googleAI }; 