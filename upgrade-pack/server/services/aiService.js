export async function analyzeImageMock(imageUrl) {
  return {
    colors: ["black", "white"],
    fitScore: 0.82,
    recommendations: ["Tighter waist fit", "Try size M"],
  };
}
