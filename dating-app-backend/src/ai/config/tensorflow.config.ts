import * as tf from '@tensorflow/tfjs';

export const initTensorFlow = async () => {
  // Khởi tạo TensorFlow
  await tf.ready();
  
  // Cấu hình để sử dụng CPU backend
  await tf.setBackend('cpu');
  console.log('Using CPU backend');
  
  // Cấu hình memory growth
  const memory = await tf.memory();
  console.log('TensorFlow memory usage:', memory);

  // Cấu hình để tối ưu hóa bộ nhớ
  tf.enableProdMode();
  tf.engine().startScope(); // Bắt đầu scope để quản lý bộ nhớ tốt hơn

  return tf;
};

// Cleanup function để gọi khi cần giải phóng bộ nhớ
export const cleanupTensorFlow = () => {
  tf.engine().endScope();
  tf.disposeVariables();
};

export { tf }; 