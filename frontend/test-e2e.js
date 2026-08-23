import puppeteer from 'puppeteer';

(async () => {
  console.log("Starting Comprehensive Puppeteer E2E tests...");
  let exitCode = 0;
  
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER CONSOLE ERROR:', msg.text());
      exitCode = 1;
    }
  });

  try {
    console.log("Navigating to http://localhost:5175...");
    await page.goto('http://localhost:5175', { waitUntil: 'networkidle0' });
    
    // Check main sections
    const html = await page.content();
    const requiredTexts = [
      'Traffic Accident Intelligence', 
      'The Problem', 
      'How It Works', 
      'Leakage-Free Spatial Intelligence', 
      'Model Intelligence', 
      'Trust &amp; Validation', 
      'FARS External Validation'
    ];
    for (const text of requiredTexts) {
      if (!html.includes(text)) {
        console.error(`Missing required text: ${text}`);
        exitCode = 1;
      }
    }

    const runPrediction = async (predictionNum) => {
      console.log(`\n--- Running Prediction ${predictionNum} ---`);
      
      // Step through wizard
      for(let i = 1; i <= 4; i++) {
         let nextBtn = await page.evaluateHandle(() => Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Next Step')));
         if(nextBtn) await nextBtn.click();
         await new Promise(r => setTimeout(r, 200));
      }

      console.log("Submitting prediction...");
      const submitBtn = await page.evaluateHandle(() => Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Analyze Accident')));
      await submitBtn.click();
      
      console.log("Waiting for results...");
      await page.waitForSelector('#results-section', { timeout: 10000 });
      
      const resultHtml = await page.content();
      if (!resultHtml.includes('Probability Distribution')) throw new Error("Probability Chart missing");
      if (!resultHtml.includes('Spatial Hotspot Analysis')) throw new Error("Spatial Info missing");
      if (!resultHtml.includes('Why did the model make this prediction?')) throw new Error("SHAP Explanation missing");
      
      console.log(`Prediction ${predictionNum} successful.`);

      console.log("Testing Reset...");
      const resetBtn = await page.evaluateHandle(() => Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Reset Defaults')));
      if (resetBtn) {
        await resetBtn.click();
        await new Promise(r => setTimeout(r, 500));
        const resetHtml = await page.content();
        if (resetHtml.includes('Probability Distribution')) {
          throw new Error("Reset FAIL: Result still present");
        }
        console.log("Reset PASS: Result cleared");
      }
    };

    // Run 3 consecutive predictions
    await runPrediction(1);
    await runPrediction(2);
    await runPrediction(3);

  } catch (err) {
    console.error("TEST FAILED:", err);
    exitCode = 1;
  } finally {
    await browser.close();
    console.log(exitCode === 0 ? "ALL TESTS PASSED" : "SOME TESTS FAILED");
    process.exit(exitCode);
  }
})();
