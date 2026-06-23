"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.regenerateDayItinerary = exports.generateTripItinerary = void 0;
const generative_ai_1 = require("@google/generative-ai");
const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new generative_ai_1.GoogleGenerativeAI(apiKey) : null;
// ==========================================
// Smart Mock Itinerary Generator (Fallback)
// ==========================================
const getMockItinerary = (destination, durationDays, budgetType, interests) => {
    const formattedDestination = destination.charAt(0).toUpperCase() + destination.slice(1);
    const baseBudget = budgetType === 'Low' ? 300 : budgetType === 'Medium' ? 800 : 2000;
    // Dynamic budget estimation
    const flights = Math.round(baseBudget * 0.4);
    const accommodation = Math.round(baseBudget * 0.3 * (durationDays / 3));
    const food = Math.round(baseBudget * 0.15 * (durationDays / 3));
    const activitiesVal = Math.round(baseBudget * 0.15 * (durationDays / 3));
    const total = flights + accommodation + food + activitiesVal;
    const interestList = interests.length > 0 ? interests : ['Sightseeing', 'Culture', 'Food'];
    // Templates of activities based on interest
    const activityPools = {
        food: [
            { title: 'Local Street Food Crawl', desc: 'Savor regional delicacies at local stalls and hidden alleyways.', cost: 25 },
            { title: 'Cooking Class & Market Tour', desc: 'Shop for fresh ingredients at the market and cook traditional dishes.', cost: 60 },
            { title: 'Fine Dining Experience', desc: 'Indulge in a premium gastronomic journey featuring signature dishes.', cost: 120 },
            { title: 'Historic Brewery/Cafe Tasting', desc: 'Learn about local brewing traditions or specialty coffee cultures.', cost: 20 },
            { title: 'Sunset Dinner Cruise', desc: 'Enjoy a gourmet multi-course meal on the water with skyline views.', cost: 85 }
        ],
        culture: [
            { title: 'Historical Temple & Shrine Visit', desc: 'Explore ancient architecture, gardens, and learn about cultural rituals.', cost: 0 },
            { title: 'National Museum Guided Tour', desc: 'Admire precious artifacts, art collections, and historical exhibits.', cost: 15 },
            { title: 'Traditional Craft Workshop', desc: 'Create your own traditional souvenir under the guidance of a master artisan.', cost: 40 },
            { title: 'Old Quarter Architectural Walk', desc: 'Stroll past historical houses, heritage sites, and preserved streets.', cost: 5 },
            { title: 'Performing Arts Theater Show', desc: 'Experience a live traditional musical, theatrical, or dance performance.', cost: 50 }
        ],
        adventure: [
            { title: 'Scenic Mountain Hike', desc: 'Trek along breathtaking ridges, waterfalls, and scenic viewpoints.', cost: 0 },
            { title: 'Kayaking & Snorkeling Excursion', desc: 'Paddle along coastal caves and swim among colorful marine life.', cost: 45 },
            { title: 'Zipline & Canopy Tour', desc: 'Soar through forest tree tops and experience an adrenaline rush.', cost: 75 },
            { title: 'Bike Tour through Hidden Paths', desc: 'Cycle away from main roads to discover pristine landscapes.', cost: 30 },
            { title: 'ATV Wilderness Ride', desc: 'Navigate off-road trails and rugged terrain in the great outdoors.', cost: 90 }
        ],
        shopping: [
            { title: 'Trendy Fashion District Exploring', desc: 'Browse boutique stores, designer outlets, and stylish concept shops.', cost: 0 },
            { title: 'Local Flea & Antique Market', desc: 'Hunt for unique vintage finds, souvenirs, and bargain items.', cost: 5 },
            { title: 'Modern Luxury Shopping Mall', desc: 'Visit state-of-the-art department complexes and global brands.', cost: 0 },
            { title: 'Local Craft & Souvenir Arcade', desc: 'Shop handmade gifts, local snacks, and artisanal items.', cost: 10 }
        ],
        default: [
            { title: 'City Highlights Sightseeing Tour', desc: 'See iconic monuments, landmark buildings, and famous photo spots.', cost: 10 },
            { title: 'Central Park / Botanic Garden Stroll', desc: 'Relax in lush public green spaces and enjoy peaceful walking paths.', cost: 0 },
            { title: 'Panoramic City Observation Deck', desc: 'Ascend to the tallest sky-rise tower to get 360-degree skyline views.', cost: 25 },
            { title: 'Evening Street & Waterfront Walk', desc: 'Stroll along active boardwalks or bright neon streets as the city lights up.', cost: 0 }
        ]
    };
    const getInterestPool = (dayIdx) => {
        const interest = interestList[dayIdx % interestList.length].toLowerCase();
        return activityPools[interest] || activityPools.default;
    };
    // Generate Day-by-Day Itinerary
    const itinerary = Array.from({ length: durationDays }, (_, i) => {
        const dayNum = i + 1;
        const pool = getInterestPool(i);
        const dayTheme = `Explore ${formattedDestination} - Focus on ${interestList[i % interestList.length]}`;
        // Choose 3 distinct activities from the pool or default
        const morningAct = pool[0 % pool.length];
        const afternoonAct = pool[1 % pool.length];
        const eveningAct = activityPools.default[dayNum % activityPools.default.length];
        const lowCostMultiplier = budgetType === 'Low' ? 0.3 : budgetType === 'Medium' ? 1.0 : 2.5;
        return {
            day: dayNum,
            theme: dayTheme,
            activities: [
                {
                    id: `act-d${dayNum}-1`,
                    time: 'Morning',
                    title: morningAct.title,
                    description: morningAct.desc,
                    cost: Math.round(morningAct.cost * lowCostMultiplier)
                },
                {
                    id: `act-d${dayNum}-2`,
                    time: 'Afternoon',
                    title: afternoonAct.title,
                    description: afternoonAct.desc,
                    cost: Math.round(afternoonAct.cost * lowCostMultiplier)
                },
                {
                    id: `act-d${dayNum}-3`,
                    time: 'Evening',
                    title: eveningAct.title,
                    description: eveningAct.desc,
                    cost: Math.round(eveningAct.cost * lowCostMultiplier)
                }
            ]
        };
    });
    // Hotel Suggestions based on destination and budget
    const hotelSuggestions = [
        {
            name: `${formattedDestination} Central Backpackers`,
            tier: 'Budget Friendly',
            priceRange: budgetType === 'Low' ? '$20 - $40 / night' : '$30 - $55 / night',
            description: 'Highly rated social hostel, clean shared dorms, free Wi-Fi, and kitchen access.'
        },
        {
            name: `${formattedDestination} Grand Plaza Hotel`,
            tier: 'Mid Range',
            priceRange: budgetType === 'Low' ? '$70 - $110 / night' : '$120 - $170 / night',
            description: 'Comfortable modern suites, business amenities, hot breakfast buffet, and central location.'
        },
        {
            name: `${formattedDestination} Royal Palace & Spa`,
            tier: 'Luxury',
            priceRange: budgetType === 'High' ? '$350+ / night' : '$250 - $400 / night',
            description: 'Five-star historic hotel, luxury infinity pool, fine dining restaurant, and personalized concierge.'
        }
    ];
    // Dynamic Packing List based on interests
    const basePacking = [
        { id: 'pack-1', name: 'Passport & Travel Visa documents', category: 'Essentials', packed: false },
        { id: 'pack-2', name: 'Comfortable walking shoes', category: 'Clothing', packed: false },
        { id: 'pack-3', name: 'Phone charger & adapter plug', category: 'Electronics', packed: false },
        { id: 'pack-4', name: 'Toothbrush & toiletries kit', category: 'Toiletries', packed: false }
    ];
    if (interests.includes('Adventure') || interests.includes('Adventure & Outdoor')) {
        basePacking.push({ id: 'pack-5', name: 'Hiking boots / Trail shoes', category: 'Clothing', packed: false }, { id: 'pack-6', name: 'Refillable water bottle', category: 'Essentials', packed: false }, { id: 'pack-7', name: 'Water-resistant backpack', category: 'Activities', packed: false });
    }
    if (interests.includes('Food') || interests.includes('Culture')) {
        basePacking.push({ id: 'pack-8', name: 'Hand sanitizer & wet wipes', category: 'Toiletries', packed: false }, { id: 'pack-9', name: 'Camera or phone lens kit', category: 'Electronics', packed: false });
    }
    if (interests.includes('Shopping')) {
        basePacking.push({ id: 'pack-10', name: 'Reusable canvas shopping bags', category: 'Activities', packed: false });
    }
    return {
        itinerary,
        estimatedBudget: {
            flights,
            accommodation,
            food,
            activities: activitiesVal,
            total
        },
        hotelSuggestions,
        packingList: basePacking
    };
};
// ==========================================
// API Generative Functions
// ==========================================
const generateTripItinerary = async (destination, durationDays, budgetType, interests) => {
    if (!genAI) {
        console.log('🤖 Gemini API Key missing. Generating rich simulated itinerary...');
        // Introduce artificial latency to simulate network load
        await new Promise(resolve => setTimeout(resolve, 1500));
        return getMockItinerary(destination, durationDays, budgetType, interests);
    }
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `
      You are an expert travel consultant. Generate a highly detailed day-by-day travel itinerary for a trip to "${destination}" for a duration of ${durationDays} days.
      The budget tier is "${budgetType}" (Low = cost-efficient/hostels/street food, Medium = boutique hotels/mid-tier restaurants, High = luxury hotels/fine dining/private tours).
      The traveler's interests are: ${interests.join(', ')}.

      You must generate an estimated budget in USD that is mathematically consistent and realistic for the destination and duration.
      You must suggest 3 realistic hotels (one "Budget Friendly", one "Mid Range", one "Luxury").
      You must generate a smart packing checklist of 5-10 items customized for this destination and the traveler's interests.

      Return ONLY a JSON object that adheres strictly to this structure:
      {
        "itinerary": [
          {
            "day": 1,
            "theme": "Day Theme/Focus",
            "activities": [
              {
                "time": "Morning | Afternoon | Evening",
                "title": "Short title of activity",
                "description": "Engaging description of the activity",
                "cost": 15
              }
            ]
          }
        ],
        "estimatedBudget": {
          "flights": 400,
          "accommodation": 350,
          "food": 180,
          "activities": 120,
          "total": 1050
        },
        "hotelSuggestions": [
          {
            "name": "Hotel Name",
            "tier": "Budget Friendly | Mid Range | Luxury",
            "priceRange": "$50 - $80 / night",
            "description": "Brief selling point of the hotel."
          }
        ],
        "packingList": [
          {
            "name": "Item name to pack",
            "category": "Essentials | Clothing | Electronics | Toiletries | Activities"
          }
        ]
      }
    `;
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: 'application/json'
            }
        });
        const responseText = result.response.text();
        const data = JSON.parse(responseText);
        // Map packing list items with IDs and packed states
        if (data.packingList && Array.isArray(data.packingList)) {
            data.packingList = data.packingList.map((item, idx) => ({
                id: `pack-${Date.now()}-${idx}`,
                name: item.name,
                category: item.category || 'Essentials',
                packed: false
            }));
        }
        // Add activity IDs to the itinerary items
        if (data.itinerary && Array.isArray(data.itinerary)) {
            data.itinerary.forEach((day) => {
                if (day.activities && Array.isArray(day.activities)) {
                    day.activities.forEach((act, aIdx) => {
                        act.id = `act-${Date.now()}-${day.day}-${aIdx}`;
                        act.cost = Number(act.cost) || 0;
                    });
                }
            });
        }
        return data;
    }
    catch (error) {
        console.error('❌ Error generating itinerary with Gemini API:', error);
        console.log('🤖 Falling back to rich simulated itinerary.');
        return getMockItinerary(destination, durationDays, budgetType, interests);
    }
};
exports.generateTripItinerary = generateTripItinerary;
const regenerateDayItinerary = async (destination, budgetType, currentDayData, dayNumber, promptText) => {
    if (!genAI) {
        console.log(`🤖 Gemini API Key missing. Regenerating Day ${dayNumber} with mock data...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Simulate regeneration based on prompt
        const promptLower = promptText.toLowerCase();
        const isOutdoor = promptLower.includes('outdoor') || promptLower.includes('nature') || promptLower.includes('adventure');
        const isRelax = promptLower.includes('relax') || promptLower.includes('slow') || promptLower.includes('chill');
        const isMuseum = promptLower.includes('museum') || promptLower.includes('history') || promptLower.includes('culture');
        let theme = `Regenerated Day ${dayNumber} - Focused on your request`;
        let activities = [];
        if (isOutdoor) {
            theme = `Day ${dayNumber}: Outdoor Exploration & Nature`;
            activities = [
                { id: `reg-d${dayNumber}-1`, time: 'Morning', title: 'Guided Nature Forest Trail Hike', description: 'Walk through scenic trails, spotting local flora and fauna.', cost: 10 },
                { id: `reg-d${dayNumber}-2`, time: 'Afternoon', title: 'Kayaking on the Scenic River', description: 'Enjoy paddle sports with views of valleys and shorelines.', cost: 35 },
                { id: `reg-d${dayNumber}-3`, time: 'Evening', title: 'Campfire Dinner under the Stars', description: 'Enjoy a rustic wood-fired barbecue dinner outdoors.', cost: 25 }
            ];
        }
        else if (isRelax) {
            theme = `Day ${dayNumber}: Relaxing & Leisure`;
            activities = [
                { id: `reg-d${dayNumber}-1`, time: 'Morning', title: 'Late Breakfast & Cafe Stroll', description: 'Sip gourmet coffee at a highly rated local roastery.', cost: 15 },
                { id: `reg-d${dayNumber}-2`, time: 'Afternoon', title: 'Premium Thermal Bath & Spa Massage', description: 'Unwind with standard massage treatment and thermal baths.', cost: 75 },
                { id: `reg-d${dayNumber}-3`, time: 'Evening', title: 'Waterfront Sunset Dining', description: 'Enjoy a fine, slow-paced meal with a view of the setting sun.', cost: 45 }
            ];
        }
        else if (isMuseum) {
            theme = `Day ${dayNumber}: Art, History & Museum Crawl`;
            activities = [
                { id: `reg-d${dayNumber}-1`, time: 'Morning', title: 'National Art History Gallery', description: 'Wander past standard historical exhibits and fine paintings.', cost: 15 },
                { id: `reg-d${dayNumber}-2`, time: 'Afternoon', title: 'Science Museum & Planetarium', description: 'Explore interactive technology galleries and watch a dome show.', cost: 20 },
                { id: `reg-d${dayNumber}-3`, time: 'Evening', title: 'Historical Lecture & Wine Pairing', description: 'Listen to a local history lecture over cheese and vintage wines.', cost: 50 }
            ];
        }
        else {
            theme = `Day ${dayNumber}: Custom Theme - "${promptText}"`;
            activities = [
                { id: `reg-d${dayNumber}-1`, time: 'Morning', title: 'Custom Morning Activity', description: `Enjoy a curated experience tailored to: ${promptText}`, cost: 10 },
                { id: `reg-d${dayNumber}-2`, time: 'Afternoon', title: 'Custom Afternoon Highlights', description: `Explore standard locations matching: ${promptText}`, cost: 20 },
                { id: `reg-d${dayNumber}-3`, time: 'Evening', title: 'Special Evening Gathering', description: 'Wind down with a local dinner fitting your request.', cost: 30 }
            ];
        }
        return { theme, activities };
    }
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `
      You are an expert travel planner. You need to regenerate the day itinerary for Day ${dayNumber} of a trip to ${destination}.
      The budget preference is "${budgetType}".
      
      Here is the day itinerary that is CURRENTLY planned for Day ${dayNumber}:
      ${JSON.stringify(currentDayData)}

      The traveler has requested to modify this specific day with these instructions:
      "${promptText}"

      Regenerate the morning, afternoon, and evening activities for Day ${dayNumber} to fulfill this request.
      
      Return ONLY a JSON object that adheres strictly to this structure:
      {
        "theme": "New theme for this day reflecting the modifications",
        "activities": [
          {
            "time": "Morning | Afternoon | Evening",
            "title": "Activity title",
            "description": "Engaging description fitting the traveler's request",
            "cost": 25
          }
        ]
      }
    `;
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: 'application/json'
            }
        });
        const responseText = result.response.text();
        const data = JSON.parse(responseText);
        if (data.activities && Array.isArray(data.activities)) {
            data.activities.forEach((act, idx) => {
                act.id = `reg-${Date.now()}-${dayNumber}-${idx}`;
                act.cost = Number(act.cost) || 0;
            });
        }
        return data;
    }
    catch (error) {
        console.error('❌ Error regenerating day with Gemini API:', error);
        console.log('🤖 Falling back to mock day regeneration.');
        // Quick mock fallback logic
        const theme = `Day ${dayNumber}: Custom Theme - "${promptText}"`;
        const activities = [
            { id: `reg-fail-${dayNumber}-1`, time: 'Morning', title: `Morning - ${promptText}`, description: `A morning activity matching: ${promptText}`, cost: 15 },
            { id: `reg-fail-${dayNumber}-2`, time: 'Afternoon', title: `Afternoon - ${promptText}`, description: `An afternoon sightseeing tour: ${promptText}`, cost: 20 },
            { id: `reg-fail-${dayNumber}-3`, time: 'Evening', title: `Evening - ${promptText}`, description: `Unwind with a dinner fitting: ${promptText}`, cost: 25 }
        ];
        return { theme, activities };
    }
};
exports.regenerateDayItinerary = regenerateDayItinerary;
