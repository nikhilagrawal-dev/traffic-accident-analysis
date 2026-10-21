import puppeteer from 'puppeteer';

(async () => {
  console.log("Starting Automated Map Integration & Prediction Verification...");
  let exitCode = 0;
  const consoleErrors = [];

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER CONSOLE ERROR:', msg.text());
      consoleErrors.push(msg.text());
    }
  });

  try {
    console.log("1. Navigating to http://localhost:5173/...");
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });

    // 2. Check initial title and sections
    const pageTitle = await page.title();
    console.log(`Page title: ${pageTitle}`);

    // 3. Test Prediction 1: Default City Philadelphia
    console.log("\n2. Submitting prediction for Philadelphia...");
    const submitBtn = await page.waitForSelector('button[type="submit"]', { timeout: 5000 });
    await submitBtn.click();

    console.log("Waiting for results section...");
    await page.waitForSelector('#results-section', { timeout: 15000 });
    console.log("Results section appeared!");

    // Verify PredictionResult content
    const resultText = await page.$eval('#results-section', el => el.innerText);
    console.log("Prediction Result summary:", resultText.split('\n').slice(0, 5).join(' | '));
    if (!resultText.toLowerCase().includes("estimated severity")) {
      throw new Error("PredictionResult missing severity label");
    }

    // Verify Interactive Map component
    console.log("Verifying Interactive City Spatial Map component...");
    await page.waitForSelector('.leaflet-container', { timeout: 8000 });
    console.log("Leaflet container is rendered!");

    // Verify Leaflet tiles
    const tileImages = await page.$$eval('.leaflet-tile-pane img', imgs => imgs.length);
    console.log(`Leaflet tiles rendered: ${tileImages}`);
    if (tileImages === 0) {
      throw new Error("No Leaflet tiles found in tile pane");
    }

    // Verify Custom Severity Marker
    const marker = await page.waitForSelector('.custom-severity-marker', { timeout: 5000 });
    console.log("Custom severity marker is present on the map!");

    // Verify Popup contents
    const mapText = await page.$eval('.leaflet-container', el => el.innerText);
    console.log("Map text snippet:", mapText.replace(/\n+/g, ' ').slice(0, 150));

    // Check city coordinates in map header
    const mapHeader = await page.$eval('div:has(> div > h3:has-text("Interactive City Spatial Map"))', el => el.innerText).catch(async () => {
      return await page.evaluate(() => {
        const headings = Array.from(document.querySelectorAll('h3'));
        const mapH = headings.find(h => h.textContent.includes('Interactive City Spatial Map'));
        return mapH ? mapH.parentElement.parentElement.innerText : '';
      });
    });
    console.log("Map Header text:", mapHeader.replace(/\n+/g, ' '));
    if (!mapHeader.includes("Philadelphia")) {
      throw new Error("Map header does not display Philadelphia");
    }

    // Test Layer Guide toggle
    console.log("Testing Layer Guide toggle button...");
    const guideBtn = await page.waitForSelector('button[title="Toggle Spatial Layer Guide"]');
    await guideBtn.scrollIntoView();
    await guideBtn.click();
    await new Promise(r => setTimeout(r, 600));
    const pageText = await page.evaluate(() => document.body.innerText);
    if (!pageText.includes("Geographic Scope & Spatial Feature Interpretation")) {
      console.log("Page text around map:", pageText.slice(pageText.indexOf("Interactive City Spatial Map"), pageText.indexOf("Interactive City Spatial Map") + 300));
      throw new Error("Layer Guide failed to expand");
    }
    console.log("Layer Guide expanded successfully!");

    // Test Recenter button
    console.log("Testing Recenter button...");
    const recBtn = await page.waitForSelector('button[title="Center map on city coordinates"]');
    await recBtn.click();
    await new Promise(r => setTimeout(r, 400));
    console.log("Recenter button clicked without error!");

    // Test Genuine DBSCAN Cluster Layer
    console.log("Testing DBSCAN Clusters Layer toggle...");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.includes('DBSCAN Clusters') || (b.title && b.title.includes('DBSCAN Clusters')));
      if (!btn) throw new Error("DBSCAN Clusters toggle button not found");
      btn.click();
    });
    console.log("Clicked DBSCAN Clusters toggle button. Waiting for markers to load...");

    // Wait for cluster markers to render
    await page.waitForSelector('.custom-cluster-marker', { timeout: 10000 });
    const clusterMarkersCount = await page.$$eval('.custom-cluster-marker', markers => markers.length);
    console.log(`Rendered genuine DBSCAN cluster markers: ${clusterMarkersCount}`);
    if (clusterMarkersCount === 0) {
      throw new Error("No DBSCAN cluster markers rendered on the map");
    }

    // Click the first cluster marker to open popup
    console.log("Clicking first DBSCAN cluster marker to verify popup...");
    await page.evaluate(() => {
      const markers = document.querySelectorAll('.custom-cluster-marker');
      if (!markers.length) throw new Error("No custom cluster markers found to click");
      markers[0].click();
    });

    // Wait for popup content to specifically show DBSCAN Cluster #
    await page.waitForFunction(() => {
      const popup = document.querySelector('.leaflet-popup-content');
      return popup && popup.innerText.includes('DBSCAN Cluster #');
    }, { timeout: 8000 });

    const popupContent = await page.$eval('.leaflet-popup-content', el => el.innerText);
    console.log("Cluster Popup text snippet:", popupContent.replace(/\n+/g, ' '));
    if (!popupContent.includes("CLUSTER SIZE") || !popupContent.includes("km away") || !popupContent.includes("Authentic DBSCAN centroid")) {
      throw new Error("Cluster popup missing verified metadata (CLUSTER SIZE, distance, or provenance)");
    }
    console.log("DBSCAN Cluster popup verified successfully!");

    // Test toggle off
    console.log("Testing toggling cluster layer OFF...");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.includes('DBSCAN Clusters') || (b.title && b.title.includes('DBSCAN Clusters')));
      if (!btn) throw new Error("DBSCAN Clusters toggle button not found");
      btn.click();
    });
    await new Promise(r => setTimeout(r, 500));
    const clusterMarkersAfterToggle = await page.$$eval('.custom-cluster-marker', markers => markers.length);
    console.log(`Cluster markers after toggling off: ${clusterMarkersAfterToggle}`);
    if (clusterMarkersAfterToggle !== 0) {
      throw new Error("DBSCAN cluster markers did not clear after toggling off");
    }
    console.log("DBSCAN cluster layer toggled off cleanly!");

    // Re-enable for subsequent checks
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.includes('DBSCAN Clusters') || (b.title && b.title.includes('DBSCAN Clusters')));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 500));

    // Verify other dashboard sections are intact
    console.log("Verifying other analytical sections...");
    const fullHtml = await page.content();
    if (!fullHtml.includes('Probability Distribution')) throw new Error("Probability Distribution missing");
    if (!fullHtml.includes('Spatial Hotspot Analysis')) throw new Error("Spatial Hotspot Analysis missing");
    if (!fullHtml.includes('Why did the model make this prediction?')) throw new Error("SHAP Explanation missing");
    console.log("Probability, Spatial, and SHAP sections all confirmed!");

    // 4. Test Prediction 2: City Change to Chicago
    console.log("\n3. Testing prediction for a different city: Chicago...");
    await page.evaluate(() => {
      const input = document.querySelector('input[placeholder="Enter a city name..."]');
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeInputValueSetter.call(input, 'Chicago');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await new Promise(r => setTimeout(r, 200));
    const newSubmitBtn = await page.waitForSelector('button[type="submit"]');
    await newSubmitBtn.click();

    console.log("Waiting for updated results for Chicago...");
    await page.waitForFunction(
      () => document.body.innerText.includes('Chicago'),
      { timeout: 15000 }
    );
    console.log("Chicago prediction completed!");

    await new Promise(r => setTimeout(r, 1000));
    const chicagoMapText = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h3'));
      const mapH = headings.find(h => h.textContent.includes('Interactive City Spatial Map'));
      return mapH ? mapH.parentElement.parentElement.innerText : '';
    });
    console.log("Chicago Map Header text:", chicagoMapText.replace(/\n+/g, ' '));
    if (!chicagoMapText.includes("Chicago")) {
      throw new Error("Map failed to update to Chicago");
    }

    // 5. Test Mobile Viewport
    console.log("\n4. Testing Mobile Viewport (390x844)...");
    await page.setViewport({ width: 390, height: 844 });
    await new Promise(r => setTimeout(r, 500));
    const mobileMap = await page.$('.leaflet-container');
    const boundingBox = await mobileMap.boundingBox();
    console.log(`Mobile map dimensions: ${boundingBox.width}px x ${boundingBox.height}px`);
    if (boundingBox.width > 390 || boundingBox.width < 300) {
      throw new Error(`Mobile map width unexpected: ${boundingBox.width}px`);
    }
    console.log("Mobile map resized and responsive!");

    // Restore desktop viewport for next checks
    await page.setViewport({ width: 1280, height: 900 });
    await new Promise(r => setTimeout(r, 300));

    // 6. Test Regression: Out-of-Coverage Location: Bhilai, Chhattisgarh (21.2092, 81.4285)
    console.log("\n5. Testing Regression for Bhilai, Chhattisgarh (Out of US Coverage)...");
    await page.evaluate(() => {
      const input = document.querySelector('input[placeholder="Enter a city name..."]');
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeInputValueSetter.call(input, 'Bhilai');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await new Promise(r => setTimeout(r, 200));
    const bhilaiSubmitBtn = await page.waitForSelector('button[type="submit"]');
    await bhilaiSubmitBtn.click();

    console.log("Waiting for results for Bhilai...");
    await page.waitForFunction(
      () => document.body.innerText.includes('Bhilai'),
      { timeout: 15000 }
    );
    console.log("Bhilai prediction loaded!");

    // Wait for map header to reflect Bhilai
    await page.waitForFunction(
      () => {
        const headings = Array.from(document.querySelectorAll('h3'));
        const mapH = headings.find(h => h.textContent.includes('Interactive City Spatial Map'));
        return mapH && mapH.parentElement.parentElement.innerText.includes('Bhilai');
      },
      { timeout: 8000 }
    );
    console.log("Map updated to Bhilai coordinates!");

    // Ensure DBSCAN clusters layer is toggled ON
    console.log("Ensuring DBSCAN Clusters Layer is toggled ON for Bhilai...");
    const isClustersToggledOn = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.title && b.title.includes('DBSCAN Clusters'));
      return btn && btn.className.includes('bg-purple-900');
    });

    if (!isClustersToggledOn) {
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const btn = btns.find(b => b.title && b.title.includes('DBSCAN Clusters'));
        if (btn) btn.click();
      });
    }

    // Wait 1.5s for cluster query to resolve
    await new Promise(r => setTimeout(r, 1500));

    // Assert: No cluster markers on map (0 US training clusters)
    const bhilaiClusterMarkers = await page.$$eval('.custom-cluster-marker', m => m.length);
    console.log(`Bhilai cluster markers count: ${bhilaiClusterMarkers}`);
    if (bhilaiClusterMarkers !== 0) {
      throw new Error(`Expected 0 DBSCAN clusters for Bhilai, but found ${bhilaiClusterMarkers}`);
    }

    // Assert: Geographic Coverage Notice is displayed on map
    const mapContainerText = await page.$eval('.leaflet-container', el => el.parentElement.innerText);
    console.log("Bhilai Map Area text snippet:", mapContainerText.replace(/\n+/g, ' ').slice(0, 200));
    if (!mapContainerText.includes("Geographic Coverage Notice") || !mapContainerText.includes("contiguous United States")) {
      throw new Error("Missing clear Geographic Coverage Notice for out-of-coverage location");
    }
    // Verify it does NOT claim "zero accidents"
    if (mapContainerText.toLowerCase().includes("zero accidents") || mapContainerText.toLowerCase().includes("0 accidents")) {
      throw new Error("Misleading claim of zero accidents found in UI");
    }
    console.log("Bhilai geographic coverage empty state verified without false accident claims!");

    // 7. Return to Philadelphia to guarantee Philadelphia behavior remains unchanged
    console.log("\n6. Re-testing Philadelphia to ensure cluster behavior is completely preserved...");
    await page.evaluate(() => {
      const input = document.querySelector('input[placeholder="Enter a city name..."]');
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeInputValueSetter.call(input, 'Philadelphia');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await new Promise(r => setTimeout(r, 200));
    const phillyBtn = await page.waitForSelector('button[type="submit"]');
    await phillyBtn.click();

    await page.waitForFunction(
      () => document.body.innerText.includes('Philadelphia'),
      { timeout: 15000 }
    );
    await new Promise(r => setTimeout(r, 1500));

    // Wait for cluster markers
    await page.waitForSelector('.custom-cluster-marker', { timeout: 10000 });
    const phillyMarkersCount = await page.$$eval('.custom-cluster-marker', m => m.length);
    console.log(`Philadelphia clusters re-verified: ${phillyMarkersCount} markers`);
    if (phillyMarkersCount === 0) {
      throw new Error("Philadelphia clusters failed to render after returning from Bhilai");
    }
    console.log("Philadelphia cluster behavior confirmed 100% intact!");

    console.log("\n=== ALL INTEGRATION CHECKS PASSED SUCCESSFULLY ===");

  } catch (err) {
    console.error("\nTEST FAILED:", err);
    exitCode = 1;
  } finally {
    await browser.close();
    if (consoleErrors.length > 0) {
      console.log(`Total console errors: ${consoleErrors.length}`);
      exitCode = 1;
    }
    process.exit(exitCode);
  }
})();
