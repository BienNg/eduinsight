// src/features/utils/openaiUtils.js
import OpenAI from 'openai';

const generateFeedbackFromComments = async (studentName, courseName, teacherNames, sessionComments = [], addressForm = 'em', modelName = "gpt-4o-mini") => {
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

    // Create the prompt for the AI with addressForm and more conversational style
    const prompt = `
    Học viên: ${studentName}
    Khóa học: ${courseName}
    Giáo viên: ${teacherNames}
    Cách xưng hô: ${addressForm} (sử dụng "${addressForm}" để xưng hô với học viên)
    
    Nhận xét từ các buổi học (có thể bằng tiếng Đức hoặc tiếng Việt):
    ${commentText}
    
    Dựa trên thông tin trên, hãy tạo một phản hồi thân thiện và mang tính trò chuyện (umgangssprachlich/conversational) cho học viên này bằng tiếng Việt.
    
    Phản hồi nên:
    1. Xưng hô đúng và nhất quán với học viên (dùng "${addressForm}" để xưng hô)
    2. Sử dụng ngôn ngữ trò chuyện tự nhiên, thân mật, không quá trang trọng hoặc học thuật
    3. Tóm tắt kết quả học tập và sự tham gia của học viên một cách cá nhân hóa
    4. Nhấn mạnh những điểm mạnh thể hiện trong các buổi học với giọng điệu cổ vũ
    5. Xác định các lĩnh vực cần cải thiện một cách nhẹ nhàng, xây dựng
    6. Đưa ra các đề xuất cụ thể và thực tế để phát triển thêm
    7. Kết thúc với lời động viên thân thiện
    
    Viết phản hồi dưới dạng đoạn văn có cấu trúc tự nhiên, giống như đang trò chuyện trực tiếp với học viên. Phản hồi PHẢI bằng tiếng Việt và sử dụng cách xưng hô đã chọn xuyên suốt.
    `;

    // Define the system message
    const systemMessage = "Bạn là trợ lý giáo dục thân thiện, giúp giáo viên tạo phản hồi cá nhân hóa cho học viên ngôn ngữ. Bạn nói chuyện một cách tự nhiên và dễ gần như một người bạn hoặc người hướng dẫn tốt. Bạn có thể hiểu và phân tích nhận xét bằng tiếng Đức và tiếng Việt, và tạo phản hồi thân thiện, tự nhiên bằng tiếng Việt. Sử dụng cách nói chuyện hàng ngày thay vì ngôn ngữ trang trọng hoặc học thuật.";

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