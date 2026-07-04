const express = require('express');
const router = express.Router();

// ─── Position-aware room parsing ────────────────────────────────
function extractPositionDirectives(prompt) {
  const p = prompt.toLowerCase();
  const directives = {};

  // Room types to look for (longer names first to match "living room" before "living")
  const roomPatterns = [
    { pattern: 'living room', type: 'living' },
    { pattern: 'dining room', type: 'dining' },
    { pattern: 'master bedroom', type: 'bedroom' },
    { pattern: 'kitchen', type: 'kitchen' },
    { pattern: 'bedroom', type: 'bedroom' },
    { pattern: 'living', type: 'living' },
    { pattern: 'dining', type: 'dining' },
    { pattern: 'bathroom', type: 'bathroom' },
    { pattern: 'parking', type: 'parking' },
    { pattern: 'garage', type: 'parking' },
    { pattern: 'balcony', type: 'balcony' },
    { pattern: 'hall', type: 'hall' },
    { pattern: 'stairs', type: 'stairs' },
    { pattern: 'staircase', type: 'stairs' },
  ];

  // Position keywords mapped to grid positions (sorted longest first)
  const positionKeywords = [
    { keywords: ['back left', 'rear left', 'top left', 'left back', 'left rear'], pos: 'back-left' },
    { keywords: ['back right', 'rear right', 'top right', 'right back', 'right rear'], pos: 'back-right' },
    { keywords: ['front left', 'bottom left', 'left front'], pos: 'front-left' },
    { keywords: ['front right', 'bottom right', 'right front'], pos: 'front-right' },
    { keywords: ['back center', 'back middle', 'rear center', 'rear middle'], pos: 'back-center' },
    { keywords: ['front center', 'front middle'], pos: 'front-center' },
    { keywords: ['center left', 'middle left', 'left center', 'left middle'], pos: 'center-left' },
    { keywords: ['center right', 'middle right', 'right center', 'right middle'], pos: 'center-right' },
    { keywords: ['back', 'rear'], pos: 'back-center' },
    { keywords: ['front'], pos: 'front-center' },
    { keywords: ['left'], pos: 'center-left' },
    { keywords: ['right'], pos: 'center-right' },
    { keywords: ['center', 'middle'], pos: 'center' },
  ];

  // For each room type, look for position directives in the prompt
  for (const { pattern: roomName, type: roomType } of roomPatterns) {
    // Skip if already found a directive for this room type
    if (directives[roomType]) continue;

    const roomIdx = p.indexOf(roomName);
    if (roomIdx === -1) continue;

    // Look for position keywords near this room mention
    // Check text within 80 chars around the room mention
    const contextStart = Math.max(0, roomIdx - 40);
    const contextEnd = Math.min(p.length, roomIdx + roomName.length + 60);
    const context = p.substring(contextStart, contextEnd);

    for (const { keywords, pos } of positionKeywords) {
      let found = false;
      for (const kw of keywords) {
        if (context.includes(kw)) {
          directives[roomType] = pos;
          found = true;
          break;
        }
      }
      if (found) break;
    }
  }

  return directives;
}

function extractRooms(prompt) {
  const p = prompt.toLowerCase();
  
  // 1. Parse floors
  let floorCount = 1;
  const floorMatch = p.match(/(\d+)\s*(?:floor|storey|story|level|flr|stry)s?/);
  const storyMatch = p.match(/(\d+)\s*story/);
  
  if (floorMatch) {
    floorCount = parseInt(floorMatch[1]);
  } else if (storyMatch) {
    floorCount = parseInt(storyMatch[1]);
  } else if (p.includes('double story') || p.includes('two floor') || p.includes('2 floor') || p.includes('second floor')) {
    floorCount = 2;
  } else if (p.includes('triple story') || p.includes('three floor') || p.includes('3 floor') || p.includes('third floor')) {
    floorCount = 3;
  } else if (p.includes('four story') || p.includes('four floor') || p.includes('4 floor') || p.includes('fourth floor')) {
    floorCount = 4;
  } else {
    if (p.includes('one floor') || p.includes('one story') || p.includes('single floor') || p.includes('single story')) {
      floorCount = 1;
    } else if (p.includes('two floor') || p.includes('two story') || p.includes('double floor') || p.includes('double story')) {
      floorCount = 2;
    } else if (p.includes('three floor') || p.includes('three story') || p.includes('triple floor') || p.includes('triple story')) {
      floorCount = 3;
    } else if (p.includes('four floor') || p.includes('four story') || p.includes('quadruple floor') || p.includes('quadruple story')) {
      floorCount = 4;
    }
  }

  floorCount = Math.max(1, Math.min(4, floorCount));

  // 2. Clean floor-related digits out before parsing bedroom count
  const cleanedForBedrooms = p
    .replace(/\b\d+\s*(?:floor|storey|story|level|flr|stry)s?\b/g, '')
    .replace(/\b(?:one|two|three|four|single|double|triple|quadruple)\s*(?:floor|storey|story|level|flr|stry)s?\b/g, '');

  // 3. Parse bedroom count
  let bedroomCount = 3;
  const bhkMatch = cleanedForBedrooms.match(/(\d+)\s*bhk/);
  const bedroomMatch = cleanedForBedrooms.match(/(\d+)\s*(?:bed|bedroom)s?/);

  if (bhkMatch) {
    bedroomCount = parseInt(bhkMatch[1]);
  } else if (bedroomMatch) {
    bedroomCount = parseInt(bedroomMatch[1]);
  } else {
    if (cleanedForBedrooms.includes('four bed') || cleanedForBedrooms.includes('4 bed') || cleanedForBedrooms.includes('four bhk') || cleanedForBedrooms.includes('4 bhk') || cleanedForBedrooms.includes('four bedroom') || cleanedForBedrooms.includes('4 bedroom')) {
      bedroomCount = 4;
    } else if (cleanedForBedrooms.includes('three bed') || cleanedForBedrooms.includes('3 bed') || cleanedForBedrooms.includes('three bhk') || cleanedForBedrooms.includes('3 bhk') || cleanedForBedrooms.includes('three bedroom') || cleanedForBedrooms.includes('3 bedroom')) {
      bedroomCount = 3;
    } else if (cleanedForBedrooms.includes('two bed') || cleanedForBedrooms.includes('2 bed') || cleanedForBedrooms.includes('two bhk') || cleanedForBedrooms.includes('2 bhk') || cleanedForBedrooms.includes('two bedroom') || cleanedForBedrooms.includes('2 bedroom')) {
      bedroomCount = 2;
    } else if (cleanedForBedrooms.includes('one bed') || cleanedForBedrooms.includes('1 bed') || cleanedForBedrooms.includes('one bhk') || cleanedForBedrooms.includes('1 bhk') || cleanedForBedrooms.includes('one bedroom') || cleanedForBedrooms.includes('1 bedroom')) {
      bedroomCount = 1;
    } else {
      if (cleanedForBedrooms.includes('1')) bedroomCount = 1;
      else if (cleanedForBedrooms.includes('2')) bedroomCount = 2;
      else if (cleanedForBedrooms.includes('3')) bedroomCount = 3;
      else if (cleanedForBedrooms.includes('4')) bedroomCount = 4;
      else if (cleanedForBedrooms.includes('one')) bedroomCount = 1;
      else if (cleanedForBedrooms.includes('two')) bedroomCount = 2;
      else if (cleanedForBedrooms.includes('three')) bedroomCount = 3;
      else if (cleanedForBedrooms.includes('four')) bedroomCount = 4;
    }
  }

  bedroomCount = Math.max(1, Math.min(4, bedroomCount));

  const rooms = [];
  for (let i = 0; i < bedroomCount; i++) rooms.push('bedroom');
  rooms.push('kitchen');
  rooms.push('living');
  rooms.push('dining');
  if (p.includes('bathroom') || p.includes('bath')) rooms.push('bathroom');
  if (p.includes('parking') || p.includes('garage')) rooms.push('parking');
  if (p.includes('balcony') || p.includes('terrace')) rooms.push('balcony');

  return { rooms, bedroomCount, floorCount };
}

// ─── Grid-based house layout with position directives ─────────
function buildHouseLayout(constraints, roomList, bedroomCount, floorCount, positionDirectives = {}) {
  const totalW = parseFloat(constraints?.width || 10);
  const totalL = parseFloat(constraints?.length || 15);
  const wallColor = constraints?.color || '#f2ede6';

  // 3×3 grid positions
  const cellW = totalW / 3;
  const cellL = totalL / 3;

  const gridPositions = {
    'back-left':     { x: -(totalW / 3),  z: -(totalL / 3) },
    'back-center':   { x: 0,              z: -(totalL / 3) },
    'back-right':    { x: (totalW / 3),   z: -(totalL / 3) },
    'center-left':   { x: -(totalW / 3),  z: 0 },
    'center':        { x: 0,              z: 0 },
    'center-right':  { x: (totalW / 3),   z: 0 },
    'front-left':    { x: -(totalW / 3),  z: (totalL / 3) },
    'front-center':  { x: 0,              z: (totalL / 3) },
    'front-right':   { x: (totalW / 3),   z: (totalL / 3) },
  };

  // Default preferred positions for room types
  const defaultPositions = {
    kitchen:  ['back-left', 'back-center', 'back-right'],
    dining:   ['back-right', 'back-center', 'center-right'],
    living:   ['front-center', 'center', 'front-left'],
    bathroom: ['center-right', 'back-right', 'center'],
    stairs:   ['center-left', 'center', 'center-right'],
    parking:  ['front-left', 'front-center', 'front-right'],
    bedroom:  ['back-left', 'back-right', 'center-left', 'center-right', 'front-left', 'front-right'],
    hall:     ['front-right', 'front-center', 'center'],
    balcony:  ['front-right', 'front-left', 'front-center'],
  };

  const rooms = [];
  const floorH = 2.32; // WALL_H (2.2) + FLOOR_T (0.12)

  for (let floor = 0; floor < floorCount; floor++) {
    const y = floor * floorH;
    const usedPositions = new Set();

    // Determine which rooms go on this floor
    let floorRooms = [];
    if (floor === 0) {
      floorRooms.push('kitchen', 'dining', 'living', 'bathroom');
      if (roomList.includes('parking')) floorRooms.push('parking');
      if (floorCount > 1) floorRooms.push('stairs');
      if (floorCount === 1) {
        for (let i = 0; i < bedroomCount; i++) floorRooms.push('bedroom');
      }
    } else if (floor === 1) {
      for (let i = 0; i < Math.min(bedroomCount, 2); i++) floorRooms.push('bedroom');
      floorRooms.push('bathroom');
      if (floor < floorCount - 1) floorRooms.push('stairs');
      if (bedroomCount >= 3 && floorCount === 2) {
        floorRooms.push('bedroom');
      } else {
        floorRooms.push('hall');
      }
    } else if (floor === 2) {
      if (bedroomCount >= 3) floorRooms.push('bedroom');
      if (bedroomCount >= 4 && floorCount === 3) floorRooms.push('bedroom');
      floorRooms.push('bathroom');
      if (floor < floorCount - 1) floorRooms.push('stairs');
      floorRooms.push('hall');
    } else if (floor === 3) {
      if (bedroomCount >= 4) floorRooms.push('bedroom');
      floorRooms.push('bathroom');
      floorRooms.push('hall');
    }

    // Phase 1: Place rooms with explicit position directives
    const placedRoomTypes = [];
    const unplacedRooms = [];

    for (const roomType of floorRooms) {
      const directive = positionDirectives[roomType];
      if (directive && gridPositions[directive] && !usedPositions.has(directive)) {
        const pos = gridPositions[directive];
        rooms.push({
          type: roomType,
          position: [pos.x, y, pos.z],
          size: [cellW * 0.92, cellL * 0.92]
        });
        usedPositions.add(directive);
        placedRoomTypes.push(roomType);
      } else {
        unplacedRooms.push(roomType);
      }
    }

    // Phase 2: Place remaining rooms in their default preferred positions
    for (const roomType of unplacedRooms) {
      const preferences = defaultPositions[roomType] || Object.keys(gridPositions);
      let placed = false;

      for (const pref of preferences) {
        if (!usedPositions.has(pref) && gridPositions[pref]) {
          const pos = gridPositions[pref];
          rooms.push({
            type: roomType,
            position: [pos.x, y, pos.z],
            size: [cellW * 0.92, cellL * 0.92]
          });
          usedPositions.add(pref);
          placed = true;
          break;
        }
      }

      // Fallback: place in any available position
      if (!placed) {
        for (const [posKey, pos] of Object.entries(gridPositions)) {
          if (!usedPositions.has(posKey)) {
            rooms.push({
              type: roomType,
              position: [pos.x, y, pos.z],
              size: [cellW * 0.92, cellL * 0.92]
            });
            usedPositions.add(posKey);
            break;
          }
        }
      }
    }
  }

  return { rooms, wallColor, dimensions: { w: totalW, l: totalL } };
}

router.get('/status', (req, res) => {
  res.json({
    grokActive: !!(process.env.GROK_API_KEY || process.env.XAI_API_KEY),
    grokModel: process.env.GROK_MODEL || 'grok-beta',
    ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434'
  });
});

router.post('/chat', async (req, res) => {
  try {
    const { prompt, model = 'llama3', constraints, grokApiKey: bodyKey } = req.body;
    const { rooms: roomList, bedroomCount, floorCount } = extractRooms(prompt);
    const positionDirectives = extractPositionDirectives(prompt);
    
    console.log('Parsed position directives:', positionDirectives);
    console.log(`Layout: ${bedroomCount} bedrooms, ${floorCount} floors`);
    
    const houseLayout = buildHouseLayout(constraints, roomList, bedroomCount, floorCount, positionDirectives);

    const constraintText = constraints
      ? `\nPlot: ${constraints.width}m × ${constraints.length}m, Budget: $${constraints.budget}\n`
      : '';

    let aiText = '';

    // 1. Try Grok AI (xAI API)
    const grokApiKey = req.headers['x-grok-api-key'] || bodyKey || process.env.GROK_API_KEY || process.env.XAI_API_KEY;
    if (grokApiKey) {
      try {
        const grokModel = process.env.GROK_MODEL || 'grok-beta';
        console.log(`Contacting Grok API (https://api.x.ai/v1) using model: ${grokModel}...`);
        const grokRes = await fetch('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${grokApiKey}`
          },
          body: JSON.stringify({
            model: grokModel,
            messages: [
              {
                role: 'system',
                content: `You are a professional AI architect. Give a short 3-4 sentence architectural recommendation.${constraintText}`
              },
              {
                role: 'user',
                content: prompt
              }
            ]
          }),
          signal: AbortSignal.timeout(25000)
        });

        if (grokRes.ok) {
          const d = await grokRes.json();
          aiText = d?.choices?.[0]?.message?.content || '';
          console.log('Grok AI response retrieved successfully.');
        } else {
          const errText = await grokRes.text();
          console.warn(`Grok API returned error status ${grokRes.status}:`, errText);
        }
      } catch (e) {
        console.warn('Grok API invocation failed, falling back:', e.message);
      }
    }

    // 2. Fallback to local Ollama
    if (!aiText.trim()) {
      try {
        console.log('Contacting local Ollama server at http://localhost:11434/api/generate...');
        const ollamaRes = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            prompt,
            system: `You are a professional AI architect. Give a short 3-4 sentence architectural recommendation.${constraintText}`,
            stream: false
          }),
          signal: AbortSignal.timeout(25000)
        });
        if (ollamaRes.ok) {
          const d = await ollamaRes.json();
          aiText = d?.response || '';
          console.log('Ollama local response retrieved successfully.');
        }
      } catch (e) {
        console.warn('Ollama offline, using standard text fallback.');
      }
    }

    // 3. Absolute fallback
    if (!aiText.trim()) {
      const positionInfo = Object.keys(positionDirectives).length > 0
        ? ` Rooms have been placed exactly as specified: ${Object.entries(positionDirectives).map(([room, pos]) => `${room} at ${pos.replace('-', ' ')}`).join(', ')}.`
        : '';
      aiText = `I've designed a beautiful ${floorCount}-floor ${bedroomCount}-bedroom (BHK) plan on your ${constraints?.width || 10}×${constraints?.length || 15}m plot. The layout includes a spacious living room, modern open-plan kitchen-dining, ${bedroomCount} bedrooms, ${floorCount > 1 ? 'connecting staircases,' : ''} and bathrooms.${positionInfo} The 3D interactive dollhouse model has been fully rendered — you can rotate, zoom, explore each floor, or click "Walk Through" for a guided tour!`;
    }

    res.json({ response: aiText, ...houseLayout });
  } catch (error) {
    console.error('Route error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─── Vision-based room analysis endpoint ──────────────────────
router.post('/describe-room', async (req, res) => {
  try {
    const { imageUrl, style, instructions } = req.body;
    const grokApiKey = req.headers['x-grok-api-key'] || req.body.grokApiKey || process.env.GROK_API_KEY || process.env.XAI_API_KEY;
    
    let roomDescription = '';
    
    const systemPrompt = `You are an expert interior designer and architect. Analyze the room image and provide a VERY DETAILED visual description in ONE paragraph (no bullet points, no line breaks). Include:
- Room type (bedroom, kitchen, living room, etc.)
- Camera angle and perspective (eye-level, bird's eye, corner view, etc.)
- Room dimensions feel (small, medium, large, spacious)
- Wall colors and textures
- Floor type and color (tiles, wood, carpet, marble)
- All furniture present and their positions (left, right, center, back, front)
- Window and door locations
- Lighting conditions (natural light direction, artificial lights)
- Any decorations (paintings, plants, curtains, rugs)

This description will be used to regenerate the room, so be extremely precise about spatial layout and positions.`;

    // 1. Try Grok Vision API
    if (grokApiKey && imageUrl) {
      try {
        const grokVisionModel = 'grok-2-vision-latest';
        console.log(`Analyzing room with Grok Vision (${grokVisionModel})...`);
        
        const grokRes = await fetch('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${grokApiKey}`
          },
          body: JSON.stringify({
            model: grokVisionModel,
            messages: [
              { role: 'system', content: systemPrompt },
              {
                role: 'user',
                content: [
                  { type: 'text', text: 'Describe this room in precise visual detail for image recreation.' },
                  { type: 'image_url', image_url: { url: imageUrl } }
                ]
              }
            ]
          }),
          signal: AbortSignal.timeout(30000)
        });

        if (grokRes.ok) {
          const d = await grokRes.json();
          roomDescription = d?.choices?.[0]?.message?.content || '';
          console.log('Grok Vision room analysis complete.');
        } else {
          const errText = await grokRes.text();
          console.warn(`Grok Vision returned ${grokRes.status}:`, errText);
        }
      } catch (e) {
        console.warn('Grok Vision failed:', e.message);
      }
    }

    // 2. Try Ollama with llava (vision model) if Grok unavailable
    if (!roomDescription.trim() && imageUrl) {
      try {
        // Download image and convert to base64 for Ollama
        console.log('Trying Ollama llava for room analysis...');
        const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(10000) });
        if (imgRes.ok) {
          const buffer = await imgRes.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');

          const ollamaRes = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'llava',
              prompt: 'Describe this room in precise visual detail: room type, camera angle, dimensions, wall colors, floor type, furniture positions, windows, doors, lighting, and decorations. One detailed paragraph only.',
              images: [base64],
              stream: false
            }),
            signal: AbortSignal.timeout(30000)
          });

          if (ollamaRes.ok) {
            const d = await ollamaRes.json();
            roomDescription = d?.response || '';
            console.log('Ollama llava room analysis complete.');
          }
        }
      } catch (e) {
        console.warn('Ollama llava failed:', e.message);
      }
    }

    // 3. If no vision AI available, ask text AI to infer from context
    if (!roomDescription.trim()) {
      try {
        const ollamaRes = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'llama3',
            prompt: `The user uploaded a room photo and wants a ${style || 'modern'} upgrade. ${instructions || ''}. Describe in one detailed paragraph what a typical ${style || 'modern'} version of this room would look like, including camera angle (eye-level corner perspective), room proportions, wall colors, floor type, furniture layout, lighting, and decorations. Be very specific about spatial positions.`,
            stream: false
          }),
          signal: AbortSignal.timeout(20000)
        });

        if (ollamaRes.ok) {
          const d = await ollamaRes.json();
          roomDescription = d?.response || '';
        }
      } catch (e) {
        console.warn('Text AI fallback failed:', e.message);
      }
    }

    // 4. Absolute fallback: generate a default description
    if (!roomDescription.trim()) {
      roomDescription = `A spacious rectangular room photographed from a corner perspective at eye level. The room has light-colored walls with smooth finish, a clean floor, standard ceiling height, natural light coming from windows on the far wall, and a simple but functional furniture arrangement with items placed along the walls leaving the center open.`;
    }

    res.json({ description: roomDescription });
  } catch (error) {
    console.error('Room description error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
