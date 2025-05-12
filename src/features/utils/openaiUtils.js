// src/features/utils/openaiUtils.js
import OpenAI from 'openai';

const generateFeedbackFromComments = async (studentName, courseName, teacherNames, sessionComments = [], modelName = "gpt-4o-mini") => {
  try {
    // Check if API key is available
    const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
    
    if (!apiKey) {
      console.error("OpenAI API key is missing! Please add REACT_APP_OPENAI_API_KEY to your .env file");
      return "Error: OpenAI API key is missing. Please configure it in the application settings.";
    }
    
    // Initialize OpenAI client with your API key
    const openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true // Only use this flag during development
    });

    // Prepare session comments for the prompt
    const commentText = sessionComments.length > 0 
      ? sessionComments.map(comment => `- ${comment}`).join('\n')
      : "Chưa có nhận xét cụ thể từ các buổi học."; // Vietnamese for "No specific comments available from sessions"

    // Create the prompt for the AI
    const prompt = `
    Học viên: ${studentName}
    Khóa học: ${courseName}
    Giáo viên: ${teacherNames}
    
    Nhận xét từ các buổi học (có thể bằng tiếng Đức hoặc tiếng Việt):
    ${commentText}
    
    Dựa trên thông tin trên, hãy tạo một phản hồi toàn diện cho học viên này bằng tiếng Việt.
    Phản hồi nên:
    1. Tóm tắt kết quả học tập và sự tham gia của học viên
    2. Nhấn mạnh những điểm mạnh thể hiện trong các buổi học
    3. Xác định các lĩnh vực cần cải thiện
    4. Đưa ra các đề xuất cụ thể để phát triển thêm
    5. Sử dụng giọng điệu thân thiện, động viên và mang tính xây dựng
    
    Viết phản hồi dưới dạng đoạn văn có cấu trúc tốt mà có thể chia sẻ với học viên. Phản hồi PHẢI bằng tiếng Việt.
    `;

    // Define the system message
    const systemMessage = "Bạn là trợ lý giáo dục có kinh nghiệm giúp giáo viên tạo phản hồi có ý nghĩa cho học viên ngôn ngữ. Bạn có thể hiểu và phân tích nhận xét bằng tiếng Đức và tiếng Việt, và tạo phản hồi phù hợp bằng tiếng Việt. Phản hồi của bạn nên thân thiện, chân thành, và cung cấp hướng dẫn cụ thể để cải thiện.";

    // Configure the API request based on the model
    const apiRequest = {
      model: modelName, // Using the provided model name (default: gpt-4o-mini)
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
    };
    
    // Add the correct token parameter based on model type
    if (modelName.includes('o') && !modelName.includes('turbo')) {
      // For o-series models (gpt-4o, gpt-4o-mini)
      apiRequest.max_completion_tokens = 800;
    } else {
      // For other models (gpt-3.5-turbo, gpt-4-turbo)
      apiRequest.max_tokens = 800;
    }

    // Make the API call to OpenAI
    const response = await openai.chat.completions.create(apiRequest);

    // Return the generated feedback
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error generating feedback:", error);
    return `Lỗi khi tạo phản hồi: ${error.message}`;
  }
};

export { generateFeedbackFromComments };