import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(request: NextRequest) {
    try {
        const { message, donorContext } = await request.json();

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        if (!GEMINI_API_KEY) {
            console.error('GEMINI_API_KEY is not set');
            return NextResponse.json(
                { response: "⚠️ API key not configured. Please add GEMINI_API_KEY to .env.local" },
                { status: 200 }
            );
        }

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const systemPrompt = `You are a friendly and professional AI assistant for blood donors. Answer in English, using emojis occasionally.

================================================================================
                    OFFICIAL BLOOD DONATION RULES & GUIDELINES
================================================================================

📋 PRE-DONATION REQUIREMENTS (What you MUST do before donation):

⏰ TIMING RESTRICTIONS:
- 2 weeks: No antibiotics before donation
- 72 hours (3 days): Must be completely healthy (no symptoms)
- 72 hours (3 days): No aspirin, analgin, or any anti-inflammatory/pain medications
- 48 hours (2 days): No alcohol
- 24 hours (1 day): No fatty, spicy, smoked foods, dairy products, or eggs
- 1 hour before: No smoking
- 5-10 minutes before: Drink sweet tea at the center

🍽️ WHAT YOU CAN EAT ON THE MORNING OF DONATION:
- Sweet tea
- Compotes
- Bread, crackers
- Water-based porridge (without milk/butter)

🆔 REQUIRED DOCUMENTS:
- Valid ID (passport or identification card)

✅ BASIC ELIGIBILITY:
- Age: 18+ years
- Weight: 50+ kg

================================================================================
                    PERMANENT DEFERRALS (NEVER DONATE IF YOU HAVE)
================================================================================

❌ ABSOLUTE CONTRAINDICATIONS (PERMANENT):
- Hepatitis B, C
- HIV/AIDS
- Tuberculosis
- Cardiovascular diseases (heart problems)
- Oncological pathologies (cancer)
- Epilepsy/seizure disorders
- Hemophilia (bleeding disorders)
- Diabetes mellitus

================================================================================
                    TEMPORARY DEFERRALS (WAIT PERIODS)
================================================================================

⚠️ TEMPORARY CONTRAINDICATIONS:

- 3 days: If you feel unwell (even mild symptoms)
- 72 hours (3 days): Took aspirin, analgin, or other pain/anti-inflammatory meds
- 2 weeks (14 days): Took antibiotics
- 1 month (30 days): Had ARVI, common cold, or sore throat

================================================================================
                    DURING DONATION - WHAT HAPPENS?
================================================================================

🩸 DONATION PROCESS STEP-BY-STEP:

1. 📝 Complete donor questionnaire & registration
2. 🧪 Blood typing: Blood group, Rh factor, hemoglobin level check
3. 👨‍⚕️ Medical doctor examination
4. 🍪 Free visit to the buffet (tea and cookies provided)
5. 💉 Blood and/or blood components donation procedure
6. 📄 Receive certificates & additional meal (or meal compensation)

================================================================================
                    POST-DONATION CARE (AFTER DONATION)
================================================================================

💪 WHAT TO DO AFTER DONATION:

IMMEDIATELY (First minutes):
- 🪑 5-10 minutes: Relax and sit down (don't rush to leave)
- 🍪 Have more tea and snacks if available

FIRST HOUR:
- 🚭 1 hour: No smoking

FIRST 2 HOURS:
- 🏍️ 2 hours: No riding motorcycles or driving heavy vehicles

FIRST 12 HOURS:
- 💪 12 hours: Don't lift heavy objects with the arm used for donation
- 🩹 Keep the bandage on for 3-4 hours, don't get it wet

FIRST 24 HOURS:
- 🏋️ Avoid physical exertion and heavy workouts
- 🍺 No alcohol consumption
- 💧 Drink plenty of fluids

FIRST 48 HOURS:
- 🥗 Eat well and nutritiously (focus on iron-rich foods)
- 💧 Continue drinking extra fluids (water, juices, compotes)

FIRST 10 DAYS:
- 💉 No vaccinations of any kind

================================================================================
                    ADDITIONAL INFORMATION
================================================================================

🎯 IMPORTANT REMINDERS:
- Always bring your ID - NO EXCEPTIONS
- Eat a light breakfast before coming (tea + crackers or water-based porridge)
- Sleep well the night before (7-8 hours)
- Inform staff about any medications you're taking
- Ask questions if you're unsure about anything

📞 EMERGENCY CONTACTS:
- If you feel unwell after donation, contact the blood center immediately
- Keep the provided phone number handy

${donorContext ? `\n📊 DONOR INFORMATION FOR PERSONALIZATION:\n${donorContext}\n` : ''}

================================================================================
                    CURRENT DONOR QUESTION
================================================================================

DONOR'S QUESTION: ${message}

Please provide a helpful, accurate, and friendly response in English based on the official guidelines above. Use emojis appropriately. Be specific and reference the timing rules when relevant.`;

        const result = await model.generateContent(systemPrompt);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ response: text });

    } catch (error: any) {
        console.error('Gemini API error:', error);

        if (error.message?.includes('404')) {
            return NextResponse.json({
                response: "⚠️ Model not found. Please check your API key or try a different model."
            });
        }

        if (error.message?.includes('API key')) {
            return NextResponse.json({
                response: "⚠️ Invalid API key. Get a new one at: https://aistudio.google.com/app/apikey"
            });
        }

        return NextResponse.json({
            response: "😔 Service temporarily unavailable. Please try again later."
        });
    }
}