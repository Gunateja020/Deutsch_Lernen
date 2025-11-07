import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Flashcard, ReviewHistory, ReviewRating, SrsData, ChatMessage, DailyLesson, ConversationMessage, StoryPart, ChallengeStats } from "../types";
import { getCardId } from "./srsService";

export async function generateLesson(topic: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

  const prompt = `
    You are a German language teacher for absolute beginners.
    Create a short, simple, and easy-to-understand lesson about "${topic}".
    The lesson should be structured as follows:
    1. A brief, simple explanation of the topic in English.
    2. A list of 5-8 key German words or phrases related to the topic, with their English translations.
    3. A "Quick Quiz" section with 2-3 practice questions based on the lesson content.
    4. A final "Answers" section for the quiz.
    
    Use markdown for formatting. Use bold for German words (e.g., **Hallo**).

    Example for "Greetings":
    ### Greetings (Grüße)
    
    Greetings are essential for starting a conversation. Here are some common ways to greet people in German.

    *   **Hallo** - Hello
    *   **Guten Morgen** - Good morning
    *   **Guten Tag** - Good day
    *   **Wie geht's?** - How's it going?

    ### Quick Quiz
    1. How do you say "Good morning" in German?
    2. What does **Hallo** mean?

    ### Answers
    1. Guten Morgen
    2. Hello
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating lesson:", error);
    // FIX: Updated error message to be more generic and not mention API keys.
    throw new Error("Failed to generate lesson from AI. Please try again later.");
  }
}

export async function getTutorResponse(history: ChatMessage[]): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

  const userPrompt = history[history.length - 1].content;
  
  const prompt = `You are a friendly and engaging German language tutor named 'Deutsch AI'. Your student is an absolute beginner. Keep your explanations simple, clear, and encouraging. Always format your responses using markdown. When you use a German word or phrase, put it in bold (e.g., **Apfel**). Your goal is to have a natural conversation and guide the student in their learning journey.

Here is the conversation so far (don't repeat your greeting if the conversation has already started):
${history.slice(0, -1).map(msg => `${msg.sender === 'ai' ? 'Deutsch AI' : 'Student'}: ${msg.content}`).join('\n')}

Now, respond to the student's latest message:
Student: ${userPrompt}
Deutsch AI:`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error getting tutor response:", error);
    throw new Error("I seem to be having trouble connecting. Please try again in a moment.");
  }
}

export async function generatePronunciation(word: string, lang: string): Promise<string | undefined> {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

  // Choose voice name per language. Replace with available voices if these don't work:
  let voiceName = "Kore"; // German (female)
  if (lang === "en") voiceName = "en-US-Neural2-J"; // English (male), or try "en-US-Standard-B", etc.

  const prompt = `Pronounce the ${lang === "en" ? "English" : "German"} word: ${word}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio;
  } catch (error) {
    console.error("Error generating pronunciation:", error);
    return;
  }
}

export async function generatePracticeSession(allCards: Flashcard[], srsData: SrsData, reviewHistory: ReviewHistory): Promise<string[]> {
  const ai = new GoogleGenAI({ apiKey:import.meta.env.VITE_API_KEY });

  const reviewsByCard = reviewHistory.reduce((acc, log) => {
    if (!acc[log.cardId]) {
      acc[log.cardId] = [];
    }
    acc[log.cardId].push(log.rating);
    return acc;
  }, {} as Record<string, ReviewRating[]>);

  const cardDataForAI = allCards.map(card => {
    const cardId = getCardId(card.originDeck!, card.german);
    const data = srsData[cardId];
    return {
      cardId,
      german: card.german,
      status: data?.status || 'new',
      lastRating: data?.lastRating,
      interval: data?.interval || 0,
      reviewHistory: reviewsByCard[cardId] || []
    };
  });

  const prompt = `
      You are an intelligent language learning assistant. Your task is to create a personalized 'Free Practice' flashcard session for a user learning German. The user has provided a list of all their flashcards along with their learning progress data, including the full history of every review for each card.

      Your goal is to select up to 30 cards for the session, or fewer if the total number of cards is less than 30. You must analyze the user's review patterns to prioritize cards that the user finds difficult, but also include a mix of other cards to keep the session balanced.
      
      **Analysis Guide:**
      - The \`reviewHistory\` array shows every rating the user has ever given for a card, from oldest to newest.
      - A high frequency of 'again' and 'hard' ratings indicates a difficult card.
      - A card that was previously 'easy' but recently rated 'hard' or 'again' is a very high priority, as it indicates the user is forgetting it.
      - A card with a long history of 'easy' or 'good' ratings is likely mastered and should be very low priority.
      
      **Prioritization guide:**
      1.  **Highest priority:** Cards that show a pattern of being forgotten (e.g., \`["easy", "easy", "hard"]\`). Also, cards with many recent 'again' or 'hard' ratings.
      2.  **High priority:** Cards in the 'learning' status with a short review interval.
      3.  **Medium priority:** 'New' cards the user hasn't seen yet.
      4.  **Low priority:** Cards consistently rated 'good'.
      5.  **Lowest priority:** Cards that are 'mature' (long interval) or have a long, consistent history of 'easy' ratings. Include very few of these, just to reinforce long-term memory.

      Here is the list of all available cards in JSON format:
      ${JSON.stringify(cardDataForAI)}

      Please return a JSON array containing only the \`cardId\` strings for the selected cards. The array should be shuffled to provide a random practice order.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
            description: "The cardId of a selected flashcard."
          },
        },
      },
    });

    const resultText = response.text.trim();
    if (!resultText.startsWith('[') || !resultText.endsWith(']')) {
        throw new Error("AI returned a non-JSON array response.");
    }

    const cardIds = JSON.parse(resultText);
    
    if (!Array.isArray(cardIds) || cardIds.some(id => typeof id !== 'string')) {
      throw new Error("AI returned data in an unexpected format.");
    }
    
    return cardIds;

  } catch (error) {
    console.error("Error generating practice session:", error);
    throw new Error("Failed to create an AI-powered practice session. Please try again.");
  }
}

export async function generateDailyLesson(previousTopics: string[], userLevel: string): Promise<DailyLesson> {
  const ai = new GoogleGenAI({ apiKey:import.meta.env.VITE_API_KEY });

  const prompt = `
    You are a German language teacher creating a "Lesson of the Day".
    The student's current proficiency level is ${userLevel} (CEFR).
    Your goal is to introduce a new, self-contained concept that is appropriate for this level. It could be a grammar rule, a cultural insight, or a set of themed vocabulary.
    
    To ensure variety, please avoid topics from this list of previously covered lessons: [${previousTopics.join(', ')}]. If the list is empty, pick a classic topic suitable for an ${userLevel} learner.

    You MUST return your response as a single, valid JSON object that adheres to the following schema. Do not include any text or markdown formatting outside of the JSON object.

    The JSON object must have three keys:
    1. "topic": A short, descriptive string for the lesson title (e.g., "Nominative Case Pronouns").
    2. "explanation": A string containing a simple, clear explanation of the topic in English. Use markdown for formatting. For example, use '#' for headers, '*' for bullet points, and surround any German examples with double asterisks (e.g., **Ich**).
    3. "vocabulary": An array of JSON objects. Each object must have two keys: "german" (a string) and "english" (a string). This list should contain 5-8 key vocabulary words or example phrases from the lesson that can be turned into flashcards.

    Example Response for a beginner:
    {
      "topic": "Ordering Coffee",
      "explanation": "### Ordering a Coffee in Germany\\n\\nGoing to a café is a great way to practice your German! Here are the key phrases you'll need.\\n\\n* To order, you can say **Ich hätte gern...** (I would like...).\\n* The barista might ask **Zusammen oder getrennt?** (Together or separate?) if you are with someone and want to pay.",
      "vocabulary": [
        { "german": "ein Kaffee, bitte", "english": "A coffee, please" },
        { "german": "mit Milch", "english": "with milk" },
        { "german": "ohne Zucker", "english": "without sugar" },
        { "german": "Was kostet das?", "english": "How much does that cost?" },
        { "german": "Zum Mitnehmen", "english": "To go / takeaway" }
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            explanation: { type: Type.STRING },
            vocabulary: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  german: { type: Type.STRING },
                  english: { type: Type.STRING },
                },
                required: ["german", "english"],
              },
            },
          },
          required: ["topic", "explanation", "vocabulary"],
        },
      },
    });

    const lesson = JSON.parse(response.text);
    if (!lesson.topic || !lesson.explanation || !Array.isArray(lesson.vocabulary)) {
        throw new Error("AI response did not match the required format.");
    }
    return lesson as DailyLesson;

  } catch (error) {
    console.error("Error generating daily lesson:", error);
    throw new Error("Failed to generate the lesson of the day. Please try again later.");
  }
}

export async function generateDailyVocabulary(userLevel: string, existingWords: string[]): Promise<Flashcard[]> {
  const ai = new GoogleGenAI({ apiKey:import.meta.env.VITE_API_KEY });

  const prompt = `
    You are a German language teacher. Your task is to generate 5 to 10 new, useful vocabulary words for a student whose current proficiency level is ${userLevel} (CEFR).
    
    **CRITICAL RULE:** You MUST NOT suggest any words from the following list of words the user already knows:
    [${existingWords.join(', ')}]

    If the list of existing words is very long, just use it as a reference to avoid common words and focus on providing new, level-appropriate vocabulary.

    You MUST return your response as a single, valid JSON object that adheres to the following schema. The JSON object must contain a single key, "vocabulary", which is an array of objects. Each object must have two keys: "german" (a string) and "english" (a string).

    Do not include any text or markdown formatting outside of the JSON object.

    Example Response:
    {
      "vocabulary": [
        { "german": "die Gabel", "english": "the fork" },
        { "german": "der Löffel", "english": "the spoon" },
        { "german": "das Messer", "english": "the knife" },
        { "german": "der Teller", "english": "the plate" },
        { "german": "die Schüssel", "english": "the bowl" }
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            vocabulary: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  german: { type: Type.STRING },
                  english: { type: Type.STRING },
                },
                required: ["german", "english"],
              },
            },
          },
          required: ["vocabulary"],
        },
      },
    });

    const result = JSON.parse(response.text);
    if (!result.vocabulary || !Array.isArray(result.vocabulary)) {
        throw new Error("AI response did not match the required format.");
    }
    return result.vocabulary as Flashcard[];

  } catch (error) {
    console.error("Error generating daily vocabulary:", error);
    throw new Error("Failed to generate new vocabulary. Please try again later.");
  }
}

export async function evaluateLevelProgression(srsData: SrsData, reviewHistory: ReviewHistory, currentLevel: string, challengeStats: ChallengeStats): Promise<{ promotionApproved: boolean; nextLevel: string; reasoning: string; }> {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
    const CEFR_LEVELS = ["A1.1", "A1.2", "A2.1", "A2.2", "B1.1", "B1.2"];
    const currentLevelIndex = CEFR_LEVELS.indexOf(currentLevel);
    const nextLevel = currentLevelIndex < CEFR_LEVELS.length - 1 ? CEFR_LEVELS[currentLevelIndex + 1] : currentLevel;

    const prompt = `
        You are an expert German language proficiency evaluator, following the CEFR framework. Your task is to analyze a student's learning data and determine if they are ready to be promoted from their current level of **${currentLevel}** to the next level, **${nextLevel}**.

        **Analysis Data:**
        - **SRS Data Summary:** This shows the current state of all vocabulary cards. 'Mature' cards (interval > 21 days, high consecutive easy count) are a strong positive signal. A high number of 'new' or 'learning' cards is a negative signal.
        - **Review History Summary:** This shows the student's consistency and accuracy over time. A high volume of recent reviews and a high percentage of 'good'/'easy' ratings are strong positive signals.
        - **Challenge Performance:** This is a KEY INDICATOR of practical language application. High numbers here are a very strong positive signal that the user is actively using the language, not just memorizing.

        **Student's Data:**
        - Total cards: ${Object.keys(srsData).length}
        - Review logs in history: ${reviewHistory.length}
        - Current Level: ${currentLevel}
        - Next Level: ${nextLevel}
        - Conversation challenges completed: ${challengeStats.conversation}
        - Image descriptions completed: ${challengeStats.image}
        - Stories built: ${challengeStats.story}

        **Promotion Criteria:**
        - **Consistency:** Has the user been studying regularly? (Look at the volume and recency of reviews).
        - **Mastery:** Is a significant portion of their vocabulary considered 'mature' or has a long review interval?
        - **Accuracy:** Is their overall ratio of 'good'/'easy' ratings high compared to 'again'/'hard'?
        - **Practical Application:** Has the user consistently engaged with practical challenges? This demonstrates an ability to use the language actively.
        
        Based on ALL this data, decide whether to approve the promotion. Provide a clear, encouraging, and analytical reasoning for your decision.

        You MUST return your response as a single, valid JSON object with three keys:
        1. "promotionApproved": A boolean (true or false).
        2. "nextLevel": A string indicating the level the user will be promoted to if approved (e.g., "${nextLevel}").
        3. "reasoning": A string (using markdown) explaining your decision. If not approved, give specific advice on what to focus on.

        Example (Approved):
        {
          "promotionApproved": true,
          "nextLevel": "A1.2",
          "reasoning": "### Congratulations!\\n\\nYou've been promoted to A1.2. Your review consistency over the last month has been excellent, and a significant number of your core vocabulary cards are now mature. Your active participation in challenges shows you're ready for the next step. Keep up the great work!"
        }
        Example (Not Approved):
        {
          "promotionApproved": false,
          "nextLevel": "A1.1",
          "reasoning": "### Not Quite Yet!\\n\\nYou're making great progress, but you're not ready for A1.2 just yet. \\n\\n* **Focus area:** Your flashcard mastery is good, but try to engage more with the practical challenges to build your confidence in using the language. \\n\\nKeep practicing, and you'll get there soon!"
        }
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        promotionApproved: { type: Type.BOOLEAN },
                        nextLevel: { type: Type.STRING },
                        reasoning: { type: Type.STRING }
                    },
                    required: ["promotionApproved", "nextLevel", "reasoning"]
                }
            }
        });
        const result = JSON.parse(response.text);
        return result;
    } catch (error) {
        console.error("Error evaluating level progression:", error);
        throw new Error("The AI had trouble evaluating your progress. Please try again.");
    }
}


// --- Challenges ---

export async function getConversationResponse(scenario: string, history: ConversationMessage[], userLevel: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
    const prompt = `You are an AI role-playing partner for a German language learner whose current level is ${userLevel}. You are playing a character in the following scenario: "${scenario}".
    Your response should be in character, in German. Tailor the complexity of your German vocabulary and sentence structure to the user's ${userLevel} level.
    After your German response, add a section on a new line like this: "--- HINT ---" where you can provide a gentle correction or a suggestion in English if the user made a mistake. If they did well, you can offer encouragement. The hint should also be appropriate for their level.
    
    Conversation History:
    ${history.map(msg => `${msg.sender === 'ai' ? 'Character' : 'User'}: ${msg.content}`).join('\n')}
    
    Now, provide the character's next response.
    Character:`;

    try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
        return response.text;
    } catch (error) {
        console.error("Error in conversation challenge:", error);
        throw new Error("The AI is having trouble responding. Please try again.");
    }
}

export async function generateImageForDescription(): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: "A detailed, interesting, safe-for-work image for a language learner to describe. The scene should contain multiple distinct objects, people, or actions." }] },
            config: { responseModalities: [Modality.IMAGE] },
        });
        const part = response.candidates?.[0]?.content?.parts?.[0];
        if (part?.inlineData?.data) {
            return part.inlineData.data;
        }
        throw new Error("No image data received from AI.");
    } catch (error) {
        console.error("Error generating image:", error);
        throw new Error("Could not generate an image for the challenge.");
    }
}


export async function evaluateImageDescription(description: string, userLevel: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
    const prompt = `You are a helpful and encouraging German language tutor. A student at the ${userLevel} level wrote the following description of an image in German:
    
    ---
    ${description}
    ---
    
    Please provide feedback on their writing, keeping their ${userLevel} level in mind. Your feedback should:
    1.  Start with something positive.
    2.  Gently correct any grammatical errors or spelling mistakes. Explain the correction simply.
    3.  Suggest more descriptive vocabulary or alternative phrasing that would be appropriate for them to learn at their level.
    4.  End with an encouraging note.
    
    Format your response using markdown.`;

    try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
        return response.text;
    } catch (error) {
        console.error("Error evaluating description:", error);
        throw new Error("The AI is having trouble providing feedback. Please try again.");
    }
}


export async function continueStory(history: StoryPart[], userLevel: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
    
    let prompt: string;
    if (history.length === 0) {
        prompt = `You are a creative storyteller. Write a single, intriguing opening sentence in German for a collaborative story with a language learner at the ${userLevel} level. The sentence should be simple enough for the student to continue. Just return the single sentence, nothing else.`;
    } else {
        prompt = `You are a creative storyteller. You are writing a story collaboratively with a German language learner at the ${userLevel} level. Here is the story so far:
        
        ${history.map(part => part.text).join(' ')}
        
        Now, continue the story with the very next sentence. Keep it simple, engaging, and appropriate for a ${userLevel} learner. Just return the single sentence, nothing else.`;
    }

    try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
        return response.text.trim();
    } catch (error) {
        console.error("Error continuing story:", error);
        throw new Error("The AI is having trouble continuing the story. Please try again.");
    }
}
