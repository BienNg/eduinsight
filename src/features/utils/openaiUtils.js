// src/features/utils/openaiUtils.js
import OpenAI from 'openai';

const generateFeedbackFromComments = async (
  studentName, 
  courseName, 
  teacherNames, 
  sessionComments = [], 
  addressForm = 'em',
  previousFeedback = null, // New parameter for previous feedback
  modelName = "gpt-4o-mini"
) => {
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

    // Prepare previous feedback context
    let previousFeedbackText = "";
    if (previousFeedback) {
      previousFeedbackText = `
      Phản hồi trước đây từ khóa học "${previousFeedback.courseName}":
      
      ${previousFeedback.feedbackText}
      `;
    }

    // Create the prompt for the AI with natural texting style and previous feedback
    const prompt = `
    Học viên: ${studentName}
    Khóa học hiện tại: ${courseName}
    Giáo viên: ${teacherNames}
    Cách xưng hô với học viên: ${addressForm}
    Cách xưng hô của trung tâm: "tt" (trung tâm)
    
    ${previousFeedback ? previousFeedbackText : 'Đây là phản hồi đầu tiên cho học viên này.'}
    
    Nhận xét từ các buổi học khóa hiện tại (có thể bằng tiếng Đức hoặc tiếng Việt):
    ${commentText}
    
    Dựa trên thông tin trên, hãy tạo một phản hồi kiểu tin nhắn thân thiện, tự nhiên cho học viên này bằng tiếng Việt.
    
    Phản hồi nên:
    1. Xưng "tt" (trung tâm) khi nói về mình và dùng "${addressForm}" để xưng hô với học viên
    2. Nếu có phản hồi trước đây, hãy tham khảo và đề cập đến nó một cách tự nhiên:
       - Nhắc lại 1-2 điểm chính từ phản hồi trước (như kỹ năng tốt hoặc cần cải thiện)
       - So sánh sự tiến bộ hiện tại với phản hồi trước (${previousFeedback ? 'từ khóa học ' + previousFeedback.courseName : ''})
       - Đưa ra nhận xét về sự phát triển của học viên qua thời gian
    3. Kết hợp việc sử dụng từ viết tắt và từ đầy đủ một cách TỰ NHIÊN như người thật đang nhắn tin:
       - Một số từ viết tắt phổ biến trong tiếng Việt (k sử dụng tất cả, chỉ dùng một số phù hợp):
         "bt" (bài tập), "nc" (nói chuyện), "k" (không), "cx" (cũng), "tgian" (thời gian), 
         "ng" (người), "đc" (được), "gv" (giáo viên), "hs" (học sinh), "bn" (bao nhiêu), 
         "mng" (mọi người), "hc" (học), "trc" (trước), "ngta" (người ta), "đbh" (đúng không)
       - QUAN TRỌNG: Xen kẽ từ viết tắt và từ đầy đủ, chỉ viết tắt khoảng 30-40% các từ
       - Dùng các từ viết tắt ở vị trí tự nhiên, không gượng ép
    4. Thêm một số ký tự nhấn mạnh tự nhiên (như "....", "!!!", "!?", "~") và lặp lại emoji (như "😊😊")
    5. Dùng emoji đa dạng và ở vị trí tự nhiên (không phải sau mỗi câu)
    6. Thỉnh thoảng bỏ qua dấu câu cuối câu và viết thường ở đầu câu (như trong tin nhắn thật)
    7. Ngắt dòng tự nhiên như tin nhắn thật (thỉnh thoảng có dòng rất ngắn)
    8. Phản hồi nên bao gồm:
       - Lời chào thân thiện ở đầu
       - Đề cập đến sự tiến bộ từ khóa học trước (nếu có)
       - Nhận xét về sự tiến bộ và kỹ năng của học viên trong khóa học hiện tại
       - Một vài điểm cần cải thiện (nếu có)
       - Đề xuất cách luyện tập cụ thể
       - Lời khích lệ và chào kết ở cuối
    
    Viết phản hồi với phong cách TIN NHẮN THẬT, tự nhiên, như thể một người thật đang nhắn nhanh cho học viên từ trung tâm - không phải văn phong học thuật hay chính thức.
    `;

    // Define the system message
    const systemMessage = "Bạn là quản lý của một trung tâm dạy tiếng Đức, đang gửi tin nhắn phản hồi thân thiện cho học viên. Bạn đã theo dõi sự tiến bộ của học viên qua nhiều khóa học và có thể tham khảo phản hồi trước đây. Hãy viết như một người Việt Nam thực sự đang nhắn tin, với sự kết hợp tự nhiên giữa các từ viết tắt và từ đầy đủ, emoji, và cách diễn đạt thân mật. Tạo cảm giác như đang đọc tin nhắn thật từ một người quản lý thân thiện của trung tâm.";

    // Configure the API request based on the model
    const apiRequest = {
      model: modelName, // Using the provided model name (default: gpt-4o-mini)
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: prompt }
      ],
      temperature: 0.9, // Higher temperature for more natural variations
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