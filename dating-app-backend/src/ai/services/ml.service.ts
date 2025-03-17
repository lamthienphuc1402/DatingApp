import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MLModel } from '../models/ml-model.model';
import { MatchHistory } from '../models/match-history.model';
import { User } from '../../user/schema/user.schema';
import * as tf from '@tensorflow/tfjs-node';

@Injectable()
export class MLService implements OnModuleInit {
  private model: tf.LayersModel;
  private isModelTrained = false;

  constructor(
    @InjectModel(MLModel.name) private mlModelModel: Model<MLModel>,
    @InjectModel(MatchHistory.name) private matchHistoryModel: Model<MatchHistory>,
    @InjectModel(User.name) private userModel: Model<User>
  ) {}

  async onModuleInit() {
    try {
      console.log('Bắt đầu khởi tạo ML Service...');
      await this.initModel();
      console.log('Đã khởi tạo model xong');
      
      // Kiểm tra số lượng dữ liệu training
      const trainingCount = await this.getTrainingDataCount();
      console.log(`Số lượng dữ liệu training hiện tại: ${trainingCount}`);
      
      // Chỉ tạo dữ liệu nếu model chưa được train và chưa đủ dữ liệu
      if (!this.isModelTrained && trainingCount < 50) {
        console.log(`Chưa đủ dữ liệu training (${trainingCount}/50 mẫu)`);
        
        // Thử lấy dữ liệu từ matchedUsers trước
        console.log('Bắt đầu khởi tạo dữ liệu từ matchedUsers...');
        await this.initializeTrainingDataFromMatches();
        let newCount = await this.getTrainingDataCount();
        console.log(`Số lượng dữ liệu sau khi lấy từ matchedUsers: ${newCount}`);
        
        // Nếu vẫn chưa đủ, tự tạo dữ liệu bù
        if (newCount < 50) {
          console.log(`Vẫn chưa đủ dữ liệu (${newCount}/50 mẫu). Đang tạo dữ liệu bù...`);
          await this.generateSyntheticTrainingData(50 - newCount);
          newCount = await this.getTrainingDataCount();
          console.log(`Số lượng dữ liệu sau khi tạo thêm: ${newCount}`);
        }
      }

      // Kiểm tra xem có cần train model không
      const needTraining = await this.checkIfTrainingNeeded();
      
      if (needTraining) {
        const finalCount = await this.getTrainingDataCount();
        if (finalCount >= 50) {
          console.log(`Đủ dữ liệu (${finalCount} mẫu), bắt đầu training model...`);
          await this.trainModel();
        }
      } else {
        console.log('Không cần train lại model');
      }

      console.log('Hoàn thành khởi tạo ML Service');
    } catch (error) {
      console.error('Lỗi trong onModuleInit:', error);
      this.isModelTrained = false;
    }
  }

  // Hàm kiểm tra xem có cần train model hay không
  private async checkIfTrainingNeeded(): Promise<boolean> {
    // Nếu model chưa được train, cần train
    if (!this.isModelTrained) {
      return true;
    }

    // Kiểm tra xem model đã được train gần đây chưa
    const latestModel = await this.mlModelModel
      .findOne()
      .sort({ createdAt: -1 })
      .exec();
      
    if (!latestModel || !latestModel.metadata || !latestModel.metadata.trainedAt) {
      return true;
    }
    
    // Kiểm tra độ tuổi của model
    const trainedDate = new Date(latestModel.metadata.trainedAt);
    const currentDate = new Date();
    const diffTime = Math.abs(currentDate.getTime() - trainedDate.getTime());
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    
    console.log(`Model đã được train cách đây ${diffDays.toFixed(2)} ngày`);
    
    // Nếu model đã được train hơn 7 ngày trước, cần train lại
    if (diffDays > 7) {
      console.log('Model đã cũ hơn 7 ngày, cần train lại');
      return true;
    }
    
    // Kiểm tra xem có dữ liệu mới không
    const trainingCount = await this.getTrainingDataCount();
    if (latestModel.metadata.samplesCount && trainingCount > latestModel.metadata.samplesCount) {
      console.log(`Có ${trainingCount - latestModel.metadata.samplesCount} mẫu dữ liệu mới, cần train lại`);
      return true;
    }
    
    return false;
  }

  async getTrainingDataCount(): Promise<number> {
    return this.matchHistoryModel.countDocuments().exec();
  }

  private createModelTopology(): any {
    return {
      class_name: 'Sequential',
      config: {
        name: 'sequential_2',
        layers: [
          {
            class_name: 'Dense',
            config: {
              units: 128,
              activation: 'relu',
              use_bias: true,
              kernel_initializer: {
                class_name: 'VarianceScaling',
                config: {
                  scale: 1,
                  mode: 'fan_avg',
                  distribution: 'normal',
                  seed: null
                }
              },
              bias_initializer: {
                class_name: 'Zeros',
                config: {}
              },
              kernel_regularizer: {
                class_name: 'l2',
                config: {
                  l2: 0.01
                }
              },
              bias_regularizer: null,
              activity_regularizer: null,
              kernel_constraint: null,
              bias_constraint: null,
              name: 'dense_1',
              trainable: true,
              batch_input_shape: [null, 9],
              dtype: 'float32'
            }
          },
          {
            class_name: 'BatchNormalization',
            config: {
              axis: -1,
              momentum: 0.99,
              epsilon: 0.001,
              center: true,
              scale: true,
              beta_initializer: {
                class_name: 'Zeros',
                config: {}
              },
              gamma_initializer: {
                class_name: 'Ones',
                config: {}
              },
              moving_mean_initializer: {
                class_name: 'Zeros',
                config: {}
              },
              moving_variance_initializer: {
                class_name: 'Ones',
                config: {}
              },
              beta_regularizer: null,
              gamma_regularizer: null,
              beta_constraint: null,
              gamma_constraint: null,
              name: 'batch_normalization_1',
              trainable: true
            }
          },
          {
            class_name: 'Dropout',
            config: {
              rate: 0.3,
              noise_shape: null,
              seed: null,
              name: 'dropout_1',
              trainable: true
            }
          },
          {
            class_name: 'Dense',
            config: {
              units: 64,
              activation: 'relu',
              use_bias: true,
              kernel_initializer: {
                class_name: 'VarianceScaling',
                config: {
                  scale: 1,
                  mode: 'fan_avg',
                  distribution: 'normal',
                  seed: null
                }
              },
              bias_initializer: {
                class_name: 'Zeros',
                config: {}
              },
              kernel_regularizer: {
                class_name: 'l2',
                config: {
                  l2: 0.01
                }
              },
              bias_regularizer: null,
              activity_regularizer: null,
              kernel_constraint: null,
              bias_constraint: null,
              name: 'dense_2',
              trainable: true
            }
          },
          {
            class_name: 'BatchNormalization',
            config: {
              axis: -1,
              momentum: 0.99,
              epsilon: 0.001,
              center: true,
              scale: true,
              beta_initializer: {
                class_name: 'Zeros',
                config: {}
              },
              gamma_initializer: {
                class_name: 'Ones',
                config: {}
              },
              moving_mean_initializer: {
                class_name: 'Zeros',
                config: {}
              },
              moving_variance_initializer: {
                class_name: 'Ones',
                config: {}
              },
              beta_regularizer: null,
              gamma_regularizer: null,
              beta_constraint: null,
              gamma_constraint: null,
              name: 'batch_normalization_2',
              trainable: true
            }
          },
          {
            class_name: 'Dropout',
            config: {
              rate: 0.2,
              noise_shape: null,
              seed: null,
              name: 'dropout_2',
              trainable: true
            }
          },
          {
            class_name: 'Dense',
            config: {
              units: 32,
              activation: 'relu',
              use_bias: true,
              kernel_initializer: {
                class_name: 'VarianceScaling',
                config: {
                  scale: 1,
                  mode: 'fan_avg',
                  distribution: 'normal',
                  seed: null
                }
              },
              bias_initializer: {
                class_name: 'Zeros',
                config: {}
              },
              kernel_regularizer: {
                class_name: 'l1l2',
                config: {
                  l1: 0.01,
                  l2: 0.01
                }
              },
              bias_regularizer: null,
              activity_regularizer: null,
              kernel_constraint: null,
              bias_constraint: null,
              name: 'dense_3',
              trainable: true
            }
          },
          {
            class_name: 'Dense',
            config: {
              units: 1,
              activation: 'sigmoid',
              use_bias: true,
              kernel_initializer: {
                class_name: 'VarianceScaling',
                config: {
                  scale: 1,
                  mode: 'fan_avg',
                  distribution: 'normal',
                  seed: null
                }
              },
              bias_initializer: {
                class_name: 'Zeros',
                config: {}
              },
              kernel_regularizer: null,
              bias_regularizer: null,
              activity_regularizer: null,
              kernel_constraint: null,
              bias_constraint: null,
              name: 'dense_4',
              trainable: true
            }
          }
        ]
      },
      keras_version: 'tfjs-layers 4.22.0',
      backend: 'tensor_flow.js'
    };
  }

  private async saveModel(evaluation: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  }) {
    try {
      console.log('Đang lưu model với các chỉ số:', evaluation);
      
      // Lưu model dưới dạng binary
      const artifacts = await this.model.save(tf.io.withSaveHandler(async (artifacts) => {
        // Tạo metadata với các chỉ số đánh giá chính xác
        const metadata = {
          accuracy: evaluation.accuracy,
          precision: evaluation.precision,
          recall: evaluation.recall,
          f1Score: evaluation.f1Score,
          trainedAt: new Date(),
          samplesCount: await this.getTrainingDataCount()
        };

        console.log('Metadata được lưu:', metadata);

        // Tính kích thước của weightData
        const weightDataBytes = artifacts.weightData instanceof ArrayBuffer 
          ? artifacts.weightData.byteLength
          : Array.from(artifacts.weightData).reduce((sum, buffer) => sum + buffer.byteLength, 0);

        // Lưu vào MongoDB với topology cố định
        const savedModel = await this.mlModelModel.create({
          name: 'dating-model',
          version: '1.0.0',
          modelTopology: this.createModelTopology(),
          weightsData: Buffer.from(artifacts.weightData as ArrayBuffer),
          weightSpecs: artifacts.weightSpecs,
          metadata: metadata
        });

        console.log('Model đã được lưu với ID:', savedModel._id);

        return {
          modelArtifactsInfo: {
            dateSaved: new Date(),
            modelTopologyType: 'JSON',
            modelTopologyBytes: JSON.stringify(this.createModelTopology()).length,
            weightSpecsBytes: JSON.stringify(artifacts.weightSpecs).length,
            weightDataBytes
          }
        };
      }));

      console.log('Đã lưu model vào MongoDB thành công');
    } catch (error) {
      console.error('Lỗi khi lưu model vào MongoDB:', error);
      throw error;
    }
  }

  private async loadModel(): Promise<tf.LayersModel | null> {
    try {
      console.log('Đang tìm model trong MongoDB...');
      const savedModel = await this.mlModelModel
        .findOne()
        .sort({ createdAt: -1 })
        .exec();

      if (!savedModel) {
        console.log('Không tìm thấy model trong MongoDB');
        return null;
      }

      console.log('Tìm thấy model, đang load...');

      // Tạo model mới với cấu trúc tương tự
      const model = tf.sequential({
        layers: [
          tf.layers.dense({
            inputShape: [9],
            units: 128,
            activation: 'relu',
            kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
          }),
          tf.layers.batchNormalization(),
          tf.layers.dropout({ rate: 0.3 }),
          tf.layers.dense({
            units: 64,
            activation: 'relu',
            kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
          }),
          tf.layers.batchNormalization(),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({
            units: 32,
            activation: 'relu',
            kernelRegularizer: tf.regularizers.l1l2({ l1: 0.01, l2: 0.01 })
          }),
          tf.layers.dense({
            units: 1,
            activation: 'sigmoid'
          })
        ]
      });

      // Compile model
      model.compile({
        optimizer: tf.train.adamax(0.001),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
      });

      // Tạo NamedTensorMap từ weights đã lưu
      const weightMap: {[key: string]: tf.Tensor} = {};
      let offset = 0;

      for (const spec of savedModel.weightSpecs) {
        const size = spec.shape.reduce((a, b) => a * b, 1);
        const data = new Float32Array(savedModel.weightsData.buffer, offset, size);
        
        // Kiểm tra dtype hợp lệ
        const dtype = spec.dtype as keyof tf.DataTypeMap;
        if (!['float32', 'int32', 'bool', 'complex64', 'string'].includes(dtype)) {
          throw new Error(`Không hỗ trợ kiểu dữ liệu: ${dtype}`);
        }
        
        const tensor = tf.tensor(data, spec.shape, dtype);
        weightMap[spec.name] = tensor;
        offset += size * Float32Array.BYTES_PER_ELEMENT;
      }

      // Set weights cho model
      await model.setWeights(Object.values(weightMap));

      // Giải phóng bộ nhớ
      Object.values(weightMap).forEach(tensor => tensor.dispose());

      console.log('Đã load model từ MongoDB thành công');
      return model;

    } catch (error) {
      console.error('Lỗi khi load model từ MongoDB:', error);
      if (error instanceof Error) {
        console.error('Chi tiết lỗi:', error.message);
        console.error('Stack:', error.stack);
      }
      return null;
    }
  }

  private async initModel() {
    try {
      console.log('Bắt đầu khởi tạo model...');
      // Thử load model đã lưu trước
      const savedModel = await this.loadModel();
      if (savedModel) {
        console.log('Đã load model từ storage');
        this.model = savedModel;
        this.isModelTrained = true;
        
        // Kiểm tra xem model đã được train gần đây chưa (trong vòng 1 ngày)
        const latestModel = await this.mlModelModel
          .findOne()
          .sort({ createdAt: -1 })
          .exec();
          
        if (latestModel && latestModel.metadata && latestModel.metadata.trainedAt) {
          const trainedDate = new Date(latestModel.metadata.trainedAt);
          const currentDate = new Date();
          const diffTime = Math.abs(currentDate.getTime() - trainedDate.getTime());
          const diffDays = diffTime / (1000 * 60 * 60 * 24);
          
          console.log(`Model đã được train cách đây ${diffDays.toFixed(2)} ngày`);
          
          // Nếu model được train trong vòng 1 ngày, không cần train lại
          if (diffDays < 1) {
            console.log('Model đã được train gần đây, không cần train lại');
            return;
          }
        }
        
        return;
      }
    } catch (error) {
      console.log('Không tìm thấy model đã lưu, tạo model mới');
    }

    console.log('Tạo model mới...');
    // Tạo model mới nếu không load được
    try {
      this.model = tf.sequential({
        layers: [
          tf.layers.dense({
            inputShape: [9],
            units: 128,
            activation: 'relu',
            kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
          }),
          tf.layers.batchNormalization(),
          tf.layers.dropout({ rate: 0.3 }),
          tf.layers.dense({
            units: 64,
            activation: 'relu',
            kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
          }),
          tf.layers.batchNormalization(),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({
            units: 32,
            activation: 'relu',
            kernelRegularizer: tf.regularizers.l1l2({ l1: 0.01, l2: 0.01 })
          }),
          tf.layers.dense({
            units: 1,
            activation: 'sigmoid'
          })
        ]
      });

      this.model.compile({
        optimizer: tf.train.adamax(0.001),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
      });

      console.log('Đã tạo model mới thành công');
    } catch (error) {
      console.error('Lỗi khi tạo model mới:', error);
      throw error;
    }
  }

  async trainModel() {
    try {
      // Kiểm tra xem model đã được train gần đây chưa
      if (this.isModelTrained) {
        const latestModel = await this.mlModelModel
          .findOne()
          .sort({ createdAt: -1 })
          .exec();
          
        if (latestModel && latestModel.metadata && latestModel.metadata.trainedAt) {
          const trainedDate = new Date(latestModel.metadata.trainedAt);
          const currentDate = new Date();
          const diffTime = Math.abs(currentDate.getTime() - trainedDate.getTime());
          const diffDays = diffTime / (1000 * 60 * 60 * 24);
          
          // Nếu model được train trong vòng 1 ngày và không có yêu cầu đặc biệt, không cần train lại
          if (diffDays < 1) {
            console.log('Model đã được train gần đây, bỏ qua quá trình training lại');
            return;
          }
        }
      }
    
      console.log('Bắt đầu quá trình training model...');
      
      // Lấy dữ liệu training
      const matchHistories = await this.matchHistoryModel.find().exec();
      const totalSamples = matchHistories.length;
      
      if (totalSamples < 50) {
        console.log(`Chưa đủ dữ liệu để train model (${totalSamples}/50 mẫu)`);
        return;
      }

      console.log(`Training với ${totalSamples} mẫu dữ liệu`);
      
      // Phân tích dữ liệu training
      const successfulMatches = matchHistories.filter(h => h.wasSuccessfulMatch).length;
      const unsuccessfulMatches = totalSamples - successfulMatches;
      console.log(`Tỷ lệ match thành công/thất bại: ${successfulMatches}/${unsuccessfulMatches}`);

      // Cân bằng dataset
      const balancedData = await this.balanceDataset(matchHistories);
      console.log('Đã cân bằng dữ liệu training');

      // Chia dữ liệu thành training và validation sets (80/20)
      const shuffledData = balancedData.sort(() => Math.random() - 0.5);
      const splitIndex = Math.floor(shuffledData.length * 0.8);
      const trainingData = shuffledData.slice(0, splitIndex);
      const validationData = shuffledData.slice(splitIndex);

      // Chuẩn bị dữ liệu
      const { features: trainFeatures, labels: trainLabels } = this.prepareTrainingData(trainingData);
      const { features: valFeatures, labels: valLabels } = this.prepareTrainingData(validationData);

      // Convert thành tensors
      const xs = tf.tensor2d(trainFeatures);
      const ys = tf.tensor1d(trainLabels);
      const valXs = tf.tensor2d(valFeatures);
      const valYs = tf.tensor1d(valLabels);

      // Training
      const history = await this.model.fit(xs, ys, {
        epochs: 100,
        batchSize: 32,
        validationData: [valXs, valYs],
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (epoch % 10 === 0) {
              console.log(
                `Epoch ${epoch}: ` +
                `loss = ${logs.loss.toFixed(4)}, ` +
                `accuracy = ${(logs.acc * 100).toFixed(2)}%, ` +
                `val_loss = ${logs.val_loss.toFixed(4)}, ` +
                `val_accuracy = ${(logs.val_acc * 100).toFixed(2)}%`
              );
            }
          }
        }
      });

      // Đánh giá model
      const evaluation = await this.evaluateModel(valFeatures, valLabels);
      console.log('\nKết quả đánh giá model:');
      console.log(`- Độ chính xác: ${(evaluation.accuracy * 100).toFixed(2)}%`);
      console.log(`- Precision: ${(evaluation.precision * 100).toFixed(2)}%`);
      console.log(`- Recall: ${(evaluation.recall * 100).toFixed(2)}%`);
      console.log(`- F1 Score: ${(evaluation.f1Score * 100).toFixed(2)}%`);

      // Kiểm tra chỉ số trước khi lưu
      console.log('Các chỉ số trước khi lưu:', {
        accuracy: evaluation.accuracy,
        precision: evaluation.precision,
        recall: evaluation.recall,
        f1Score: evaluation.f1Score
      });

      // Lưu model
      await this.saveModel(evaluation);
      
      // Giải phóng bộ nhớ
      xs.dispose();
      ys.dispose();
      valXs.dispose();
      valYs.dispose();

      this.isModelTrained = true;
      console.log('Đã hoàn thành quá trình training model');

    } catch (error) {
      console.error('Lỗi trong quá trình training:', error);
      throw error;
    }
  }

  private prepareTrainingData(histories: MatchHistory[]): {
    features: number[][],
    labels: number[]
  } {
    const features = histories.map(history => [
      history.features.distanceScore,
      history.features.ageScore,
      history.features.interestScore,
      history.features.genderMatch,
      history.features.educationMatch,
      history.features.zodiacScore,
      ...history.features.interestVector.slice(0, 2),
      history.features.bioScore
    ]);

    const labels = histories.map(history => history.wasSuccessfulMatch ? 1 : 0);

    return { features, labels };
  }

  private async balanceDataset(histories: MatchHistory[]): Promise<MatchHistory[]> {
    const successfulMatches = histories.filter(h => h.wasSuccessfulMatch);
    const unsuccessfulMatches = histories.filter(h => !h.wasSuccessfulMatch);
    
    console.log(`Dataset ban đầu: ${successfulMatches.length} positive, ${unsuccessfulMatches.length} negative`);
    
    // Giới hạn số lượng mẫu tối đa cho mỗi class
    const MAX_SAMPLES_PER_CLASS = 50;
    
    let balancedData: MatchHistory[] = [];
    
    // Thêm mẫu từ cả hai class, giới hạn số lượng
    const positiveToAdd = Math.min(successfulMatches.length, MAX_SAMPLES_PER_CLASS);
    const negativeToAdd = Math.min(unsuccessfulMatches.length, MAX_SAMPLES_PER_CLASS);
    
    // Thêm mẫu positive và negative từ dữ liệu thật
    balancedData = [
      ...successfulMatches.slice(0, positiveToAdd),
      ...unsuccessfulMatches.slice(0, negativeToAdd)
    ];

    // Nếu thiếu mẫu, tạo thêm mẫu synthetic trong memory (không lưu DB)
    if (positiveToAdd < MAX_SAMPLES_PER_CLASS) {
      const samplesToGenerate = MAX_SAMPLES_PER_CLASS - positiveToAdd;
      for (let i = 0; i < samplesToGenerate; i++) {
        const sample = successfulMatches[Math.floor(Math.random() * successfulMatches.length)];
        balancedData.push({
          ...sample,
          features: this.augmentFeatures(sample.features)
        } as MatchHistory);
      }
    }
    
    if (negativeToAdd < MAX_SAMPLES_PER_CLASS) {
      const samplesToGenerate = MAX_SAMPLES_PER_CLASS - negativeToAdd;
      for (let i = 0; i < samplesToGenerate; i++) {
        const sample = unsuccessfulMatches[Math.floor(Math.random() * unsuccessfulMatches.length)];
        balancedData.push({
          ...sample,
          features: this.augmentFeatures(sample.features)
        } as MatchHistory);
      }
    }

    console.log(`Dataset sau khi cân bằng: ${balancedData.filter(h => h.wasSuccessfulMatch).length} positive, ${balancedData.filter(h => !h.wasSuccessfulMatch).length} negative`);
    
    return balancedData;
  }

  private augmentFeatures(features: any) {
    return {
      ...features,
      distanceScore: this.addNoise(features.distanceScore, 0.1),
      ageScore: this.addNoise(features.ageScore, 0.1),
      interestScore: this.addNoise(features.interestScore, 0.1),
      zodiacScore: this.addNoise(features.zodiacScore, 0.1),
      bioScore: this.addNoise(features.bioScore, 0.1),
      interestVector: features.interestVector.map(v => this.addNoise(v, 0.1))
    };
  }

  private addNoise(value: number, noise: number): number {
    const randomNoise = (Math.random() - 0.5) * 2 * noise;
    return Math.max(0, Math.min(1, value + randomNoise));
  }

  async predictMatch(userId: string, targetUserId: string): Promise<number> {
    if (!this.isModelTrained) {
      console.log('Model chưa được train, sử dụng phương pháp tính điểm thông thường');
      throw new Error('Model chưa được train');
    }

    try {
      const [user, targetUser] = await Promise.all([
        this.userModel.findById(userId),
        this.userModel.findById(targetUserId)
      ]);

      if (!user || !targetUser) {
        throw new Error('Không tìm thấy một trong hai người dùng');
      }

      const features = await this.calculateFeatures(user, targetUser);
      
      // Dự đoán
      const prediction = tf.tidy(() => {
        const input = tf.tensor2d([[
          features.distanceScore,
          features.ageScore,
          features.interestScore,
          features.genderMatch,
          features.educationMatch,
          features.zodiacScore,
          ...features.interestVector.slice(0, 2),
          features.bioScore
        ]]);
        return this.model.predict(input) as tf.Tensor;
      });

      const score = (await prediction.data())[0];
      prediction.dispose();

      return score;

    } catch (error) {
      console.error('Lỗi khi dự đoán match:', error);
      throw error;
    }
  }

  async updateMatchHistory(
    userId: string,
    targetUserId: string,
    wasSuccessfulMatch: boolean,
    interactionMetrics?: {
      chatDuration: number;
      messageCount: number;
      averageResponseTime: number;
      lastInteraction: Date;
    }
  ) {
    try {
      const [user, targetUser] = await Promise.all([
        this.userModel.findById(userId),
        this.userModel.findById(targetUserId)
      ]);

      if (!user || !targetUser) {
        throw new Error('Không tìm thấy một trong hai người dùng');
      }

      const features = await this.calculateFeatures(user, targetUser);
      const commonInterests = user.interests.filter(interest =>
        targetUser.interests.includes(interest)
      );

      await this.matchHistoryModel.create({
        userId,
        targetUserId,
        wasSuccessfulMatch,
        features,
        interactionMetrics,
        commonInterests,
        matchScore: wasSuccessfulMatch ? 1 : 0
      });

      // Retrain model nếu có đủ dữ liệu mới
      const totalRecords = await this.matchHistoryModel.countDocuments();
      if (totalRecords % 50 === 0) { // Retrain sau mỗi 50 records mới
        await this.trainModel();
      }

    } catch (error) {
      console.error('Lỗi khi cập nhật lịch sử match:', error);
      throw error;
    }
  }

  private async calculateFeatures(user: User, targetUser: User) {
    // Tính khoảng cách
    const distanceScore = this.calculateDistance(
      user.location?.coordinates,
      targetUser.location?.coordinates
    );

    // Tính độ tuổi
    const ageDiff = Math.abs(user.age - targetUser.age);
    const ageScore = Math.max(0, 1 - ageDiff / 10); // Giảm khoảng cách tuổi xuống 10 năm

    // Tính sở thích chung
    const commonInterests = user.interests.filter(interest =>
      targetUser.interests.includes(interest)
    );
    const interestScore = Math.min(1, commonInterests.length / 3); // Chỉ cần 3 sở thích chung để đạt điểm tối đa

    // Giới tính phù hợp
    const genderMatch = (
      targetUser.gender === user.genderPreference ||
      user.genderPreference === 'both'
    ) ? 1 : 0;

    // Học vấn
    const educationMatch = user.education === targetUser.education ? 1 : 0;

    // Cung hoàng đạo
    const zodiacScore = this.calculateZodiacCompatibility(user.zodiacSign, targetUser.zodiacSign);

    // Vector sở thích
    const interestVector = this.vectorizeInterests(user.interests, targetUser.interests);

    // Bio similarity
    const bioScore = this.calculateTextSimilarity(user.bio || '', targetUser.bio || '');

    // Chuẩn hóa điểm tổng hợp
    const totalScore = (
      distanceScore * 0.25 +
      ageScore * 0.2 +
      interestScore * 0.25 +
      genderMatch * 0.1 +
      educationMatch * 0.1 +
      zodiacScore * 0.1
    );

    return {
      distanceScore,
      ageScore,
      interestScore,
      genderMatch,
      educationMatch,
      zodiacScore,
      interestVector: interestVector.slice(0, 2),
      bioScore,
      totalScore: Math.min(1, Math.max(0.3, totalScore)) // Đảm bảo điểm tối thiểu là 30%
    };
  }

  private calculateDistance(coords1?: number[], coords2?: number[]): number {
    if (!coords1 || !coords2) return 0.5; // Giá trị mặc định nếu không có tọa độ

    const R = 6371; // Bán kính Trái Đất (km)
    const dLat = (coords2[0] - coords1[0]) * Math.PI / 180;
    const dLon = (coords2[1] - coords1[1]) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(coords1[0] * Math.PI / 180) * Math.cos(coords2[0] * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    // Chuẩn hóa khoảng cách: 
    // - Dưới 5km: điểm cao nhất
    // - 5-50km: điểm giảm dần
    // - Trên 50km: điểm thấp nhất
    if (distance <= 5) return 1;
    if (distance >= 50) return 0.3;
    return 1 - ((distance - 5) / 45) * 0.7; // Giảm tuyến tính từ 1 đến 0.3
  }

  private calculateZodiacCompatibility(zodiac1: string, zodiac2: string): number {
    const zodiacGroups = {
      fire: ['Aries', 'Leo', 'Sagittarius'],
      earth: ['Taurus', 'Virgo', 'Capricorn'],
      air: ['Gemini', 'Libra', 'Aquarius'],
      water: ['Cancer', 'Scorpio', 'Pisces']
    };

    const getElement = (zodiac: string) => {
      for (const [element, signs] of Object.entries(zodiacGroups)) {
        if (signs.includes(zodiac)) return element;
      }
      return null;
    };

    const element1 = getElement(zodiac1);
    const element2 = getElement(zodiac2);

    if (!element1 || !element2) return 0.5;

    const compatibility = {
      fire: { fire: 1, air: 1, earth: 0.5, water: 0.3 },
      earth: { earth: 1, water: 1, fire: 0.5, air: 0.3 },
      air: { air: 1, fire: 1, water: 0.5, earth: 0.3 },
      water: { water: 1, earth: 1, air: 0.5, fire: 0.3 }
    };

    return compatibility[element1][element2];
  }

  private vectorizeInterests(interests1: string[], interests2: string[]): number[] {
    const allInterests = new Set([...interests1, ...interests2]);
    const vector1 = Array.from(allInterests).map(interest => interests1.includes(interest) ? 1 : 0);
    const vector2 = Array.from(allInterests).map(interest => interests2.includes(interest) ? 1 : 0);
    
    // Tính dot product với kiểu number rõ ràng
    const dotProduct = vector1.reduce<number>((sum, val, i) => sum + val * vector2[i], 0);
    
    // Tính magnitude với kiểu number rõ ràng
    const magnitude1 = Math.sqrt(vector1.reduce<number>((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(vector2.reduce<number>((sum, val) => sum + val * val, 0));
    
    const similarity = magnitude1 && magnitude2 ? dotProduct / (magnitude1 * magnitude2) : 0;
    
    return [
      similarity,
      Math.min(interests1.length, interests2.length) / Math.max(interests1.length, interests2.length)
    ];
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    return intersection.size / union.size;
  }

  private async evaluateModel(features: number[][], labels: number[]): Promise<{
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  }> {
    const predictions = await Promise.all(
      features.map(async (feature) => {
        const prediction = tf.tidy(() => {
          const input = tf.tensor2d([feature]);
          return this.model.predict(input) as tf.Tensor;
        });
        const score = (await prediction.data())[0];
        prediction.dispose();
        return score >= 0.5 ? 1 : 0;
      })
    );

    let truePositives = 0;
    let falsePositives = 0;
    let falseNegatives = 0;
    let totalCorrect = 0;

    for (let i = 0; i < predictions.length; i++) {
      if (predictions[i] === labels[i]) totalCorrect++;
      if (predictions[i] === 1 && labels[i] === 1) truePositives++;
      if (predictions[i] === 1 && labels[i] === 0) falsePositives++;
      if (predictions[i] === 0 && labels[i] === 1) falseNegatives++;
    }

    const accuracy = totalCorrect / predictions.length;
    const precision = truePositives / (truePositives + falsePositives) || 0;
    const recall = truePositives / (truePositives + falseNegatives) || 0;
    const f1Score = 2 * (precision * recall) / (precision + recall) || 0;

    return { accuracy, precision, recall, f1Score };
  }

  private async initializeTrainingDataFromMatches() {
    try {
      // Lấy tất cả users có matchedUsers
      const users = await this.userModel.find({
        matchedUsers: { $exists: true, $ne: [] }
      }).exec();

      console.log(`Tìm thấy ${users.length} người dùng có matches`);

      for (const user of users) {
        console.log(`Đang xử lý user ${user._id} với ${user.matchedUsers?.length || 0} matches`);
        
        // Duyệt qua từng matchedUser
        for (const matchedUser of (user.matchedUsers || [])) {
          try {
            // Log để debug
            console.log('MatchedUser object:', matchedUser);
            
            // Lấy ID của matched user, có thể là string hoặc object
            let targetUserId: string;
            if (typeof matchedUser === 'string') {
              targetUserId = matchedUser;
            } else if (typeof matchedUser === 'object') {
              // Kiểm tra các trường có thể chứa ID
              if ('userId' in matchedUser && matchedUser.userId) {
                targetUserId = matchedUser.userId.toString();
              } else if ('_id' in matchedUser && matchedUser._id) {
                targetUserId = matchedUser._id.toString();
              } else {
                console.log('Không tìm thấy ID trong matchedUser object:', matchedUser);
                continue;
              }
            } else {
              console.log('Kiểu dữ liệu không hợp lệ cho matchedUser:', typeof matchedUser);
              continue;
            }

            const targetUser = await this.userModel.findById(targetUserId).exec();
            if (!targetUser) {
              console.log(`Không tìm thấy user với ID ${targetUserId}`);
              continue;
            }

            // Kiểm tra match hai chiều
            const isMatched = targetUser.matchedUsers?.some(m => {
              if (typeof m === 'string') {
                return m === user._id.toString();
              } else if (typeof m === 'object') {
                if ('userId' in m && m.userId) {
                  return m.userId.toString() === user._id.toString();
                } else if ('_id' in m && m._id) {
                  return m._id.toString() === user._id.toString();
                }
              }
              return false;
            });

            // Nếu đã có trong history thì bỏ qua
            const existingHistory = await this.matchHistoryModel.findOne({
              userId: user._id.toString(),
              targetUserId: targetUserId
            }).exec();

            if (!existingHistory) {
              // Tính toán các features
              const features = await this.calculateFeatures(user, targetUser);
              
              // Tạo match history mới
              await this.matchHistoryModel.create({
                userId: user._id.toString(),
                targetUserId: targetUserId,
                wasSuccessfulMatch: isMatched, // true nếu match 2 chiều
                features,
                commonInterests: user.interests.filter(interest =>
                  targetUser.interests.includes(interest)
                ),
                interactionMetrics: {
                  chatDuration: 0,
                  messageCount: 0,
                  averageResponseTime: 0,
                  lastInteraction: new Date()
                },
                matchScore: isMatched ? 1 : 0
              });

              console.log(`Đã tạo match history cho ${user._id} và ${targetUserId}`);
            }
          } catch (error) {
            console.error('Lỗi khi xử lý matchedUser:', error);
            continue; // Bỏ qua lỗi và tiếp tục với matchedUser tiếp theo
          }
        }
      }

      const totalRecords = await this.matchHistoryModel.countDocuments();
      console.log(`Đã tạo tổng cộng ${totalRecords} bản ghi training`);

    } catch (error) {
      console.error('Lỗi khi khởi tạo dữ liệu training từ matches:', error);
      throw error;
    }
  }

  private async generateSyntheticTrainingData(requiredSamples: number) {
    try {
      // Lấy tất cả users hiện có
      const allUsers = await this.userModel.find().exec();
      if (allUsers.length < 2) {
        console.log('Không đủ users để tạo dữ liệu tổng hợp');
        return;
      }

      console.log(`Bắt đầu tạo ${requiredSamples} mẫu dữ liệu tổng hợp`);
      let samplesCreated = 0;
      let positiveCount = 0;
      let negativeCount = 0;
      const targetRatio = 0.5; // Tỷ lệ positive/negative mong muốn

      while (samplesCreated < requiredSamples) {
        // Chọn ngẫu nhiên 2 user có tính tương thích về giới tính
        const user = allUsers[Math.floor(Math.random() * allUsers.length)];
        const potentialMatches = allUsers.filter(u => 
          u._id.toString() !== user._id.toString() &&
          (user.genderPreference === 'both' || u.gender === user.genderPreference) &&
          (u.genderPreference === 'both' || user.gender === u.genderPreference)
        );

        if (potentialMatches.length === 0) continue;
        
        const targetUser = potentialMatches[Math.floor(Math.random() * potentialMatches.length)];

        // Kiểm tra xem cặp này đã có trong history chưa
        const existingHistory = await this.matchHistoryModel.findOne({
          userId: user._id.toString(),
          targetUserId: targetUser._id.toString()
        }).exec();

        if (!existingHistory) {
          // Tính toán features
          const features = await this.calculateFeatures(user, targetUser);

          // Tính điểm tương thích tổng hợp
          const compatibilityScore = (
            features.distanceScore * 0.2 +
            features.ageScore * 0.2 +
            features.interestScore * 0.3 +
            features.genderMatch * 0.1 +
            features.educationMatch * 0.1 +
            features.zodiacScore * 0.1
          );

          // Quyết định match dựa trên tỷ lệ positive/negative mong muốn
          let wasSuccessfulMatch: boolean;
          if (positiveCount / (samplesCreated + 1) < targetRatio) {
            // Cần thêm positive samples
            wasSuccessfulMatch = compatibilityScore >= 0.6;
          } else {
            // Cần thêm negative samples
            wasSuccessfulMatch = compatibilityScore >= 0.8;
          }

          if (wasSuccessfulMatch) {
            positiveCount++;
          } else {
            negativeCount++;
          }

          // Tạo dữ liệu tương tác giả lập phù hợp với kết quả match
          const interactionMetrics = wasSuccessfulMatch ? {
            chatDuration: Math.random() * 3600000 * (0.5 + compatibilityScore), // 0-1h, tỷ lệ với điểm tương thích
            messageCount: Math.floor(Math.random() * 100 * (0.5 + compatibilityScore)), // 0-100 tin nhắn
            averageResponseTime: Math.random() * 300000 * (1.5 - compatibilityScore), // 0-5m, tỷ lệ nghịch với điểm tương thích
            lastInteraction: new Date()
          } : {
            chatDuration: 0,
            messageCount: 0,
            averageResponseTime: 0,
            lastInteraction: new Date()
          };

          // Tạo match history mới
          await this.matchHistoryModel.create({
            userId: user._id.toString(),
            targetUserId: targetUser._id.toString(),
            wasSuccessfulMatch,
            features,
            commonInterests: user.interests.filter(interest =>
              targetUser.interests.includes(interest)
            ),
            interactionMetrics,
            matchScore: wasSuccessfulMatch ? compatibilityScore : 0
          });

          samplesCreated++;
          if (samplesCreated % 10 === 0) {
            console.log(
              `Đã tạo ${samplesCreated}/${requiredSamples} mẫu dữ liệu ` +
              `(${positiveCount} positive, ${negativeCount} negative)`
            );
          }
        }
      }

      console.log(
        `Hoàn thành tạo ${samplesCreated} mẫu dữ liệu tổng hợp ` +
        `(${positiveCount} positive, ${negativeCount} negative)`
      );

    } catch (error) {
      console.error('Lỗi khi tạo dữ liệu tổng hợp:', error);
      throw error;
    }
  }

  async getModelStats() {
    try {
      const latestModel = await this.mlModelModel
        .findOne()
        .sort({ createdAt: -1 })
        .exec();

      if (!latestModel) {
        return {
          status: 'Not trained',
          message: 'Model chưa được train'
        };
      }

      const trainedAt = latestModel._id.toString().substring(0, 8);
      const timestamp = parseInt(trainedAt, 16) * 1000;

      return {
        status: 'Trained',
        version: '1.0.0',
        trainedAt: new Date(timestamp).toISOString(),
        accuracy: latestModel.metadata.accuracy,
        precision: latestModel.metadata.precision,
        recall: latestModel.metadata.recall,
        f1Score: latestModel.metadata.f1Score,
        samplesCount: latestModel.metadata.samplesCount,
        metrics: {
          accuracy: {
            value: latestModel.metadata.accuracy,
            description: 'Độ chính xác tổng thể của model trong việc dự đoán match thành công'
          },
          precision: {
            value: latestModel.metadata.precision,
            description: 'Tỷ lệ dự đoán match thành công chính xác trên tổng số dự đoán match thành công'
          },
          recall: {
            value: latestModel.metadata.recall,
            description: 'Tỷ lệ match thành công được dự đoán đúng trên tổng số match thành công thực tế'
          },
          f1Score: {
            value: latestModel.metadata.f1Score,
            description: 'Điểm cân bằng giữa precision và recall, càng cao càng tốt'
          }
        }
      };
    } catch (error) {
      console.error('Lỗi khi lấy thống kê model:', error);
      throw error;
    }
  }

  async getMatchDistribution() {
    try {
      const matchHistories = await this.matchHistoryModel.find().exec();
      
      // Tính phân phối điểm match
      const distribution = {
        '0-20': 0,
        '21-40': 0,
        '41-60': 0,
        '61-80': 0,
        '81-100': 0
      };

      matchHistories.forEach(history => {
        const score = history.matchScore * 100;
        if (score <= 20) distribution['0-20']++;
        else if (score <= 40) distribution['21-40']++;
        else if (score <= 60) distribution['41-60']++;
        else if (score <= 80) distribution['61-80']++;
        else distribution['81-100']++;
      });

      // Tính tỷ lệ match thành công
      const successfulMatches = matchHistories.filter(h => h.wasSuccessfulMatch).length;
      const totalMatches = matchHistories.length;
      const successRate = totalMatches > 0 ? (successfulMatches / totalMatches) * 100 : 0;
      const averageScore = matchHistories.length > 0 
        ? Math.round(matchHistories.reduce((acc, curr) => acc + curr.matchScore, 0) / matchHistories.length) * 100
        : 0;

      return {
        distribution,
        totalMatches,
        successfulMatches,
        successRate: Math.round(successRate * 100) / 100,
        averageScore,
      };
    } catch (error) {
      console.error('Lỗi khi lấy phân phối điểm match:', error);
      throw error;
    }
  }

  async loadSampleData() {
    try {
      console.log('Bắt đầu tải dữ liệu mẫu...');
      
      // Xóa dữ liệu cũ
      await this.matchHistoryModel.deleteMany({});
      console.log('Đã xóa dữ liệu cũ');

      // Lấy dữ liệu từ các match hiện có
      await this.initializeTrainingDataFromMatches();
      let currentCount = await this.getTrainingDataCount();
      console.log(`Số lượng dữ liệu từ match hiện có: ${currentCount}`);

      // Tạo thêm dữ liệu tổng hợp nếu chưa đủ 100 mẫu
      if (currentCount < 100) {
        console.log(`Tạo thêm ${100 - currentCount} mẫu dữ liệu tổng hợp...`);
        await this.generateSyntheticTrainingData(100 - currentCount);
        currentCount = await this.getTrainingDataCount();
      }

      return {
        success: true,
        message: 'Đã tải dữ liệu mẫu thành công',
        samplesCount: currentCount
      };
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu mẫu:', error);
      const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
      throw new Error('Không thể tải dữ liệu mẫu: ' + errorMessage);
    }
  }
} 