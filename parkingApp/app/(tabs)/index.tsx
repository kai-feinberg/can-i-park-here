import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Camera, CameraView } from 'expo-camera'; // Ensure this imports the Camera component
import * as ImageManipulator from 'expo-image-manipulator';
import { CameraType } from 'expo-camera/build/legacy/Camera.types';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';

export default function App() {
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const camera = useRef<any>(null);

  const [capturedImage, setCapturedImage] = useState<ImageManipulator.ImageResult | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setCameraPermission(status === "granted");
    })();
  }, []);

  const takePicture = async () => {
    if (camera.current) {
      try {
        const photo = await camera.current.takePictureAsync({
          quality: 0.5,
          base64: true,
        });

        if (photo.uri) {
          const manipResult = await ImageManipulator.manipulateAsync(
            photo.uri,
            [{ resize: { width: 800 } }],
            { format: ImageManipulator.SaveFormat.JPEG, base64: true }
          );
          setCapturedImage(manipResult);
          if (manipResult.base64) {
            console.log('Base64 image:', manipResult.base64.substring(0, 10));
            analyzeImage(manipResult.base64);
          }
          else {
            console.log("No base64 image found");
          }
        }
      } catch (error) {
        console.error('Error taking picture:', error);
      }
    }
  };
  const analyzeImage = async (base64Image: string) => {
    setLoading(true);
    try {
      console.log('Preparing request to API...');

      // Create a temporary file from the base64 image data
      const tempFilePath = FileSystem.documentDirectory + 'temp_image.jpg';
      await FileSystem.writeAsStringAsync(tempFilePath, base64Image, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const now = new Date();
      const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
      const date = now.toLocaleDateString('en-US');
      const time = now.toLocaleTimeString('en-US');

      // Create FormData and append the image file
      const formData = new FormData();
      formData.append('image', {
        uri: tempFilePath,
        name: 'image.jpg',
        type: 'image/jpeg'
      } as any);
      formData.append('dayOfWeek', dayOfWeek);
      formData.append('date', date);
      formData.append('time', time);

      console.log("dayOfWeek", dayOfWeek);
      console.log("date", date);
      console.log("time", time);

      console.log('Sending request to API...');
      const response = await axios.post('http://192.168.1.16:3000/analyze-sign', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000 // 60 seconds
      });

      console.log('Response status:', response.status);
      console.log('Received data:', response.data);

      setAnalysis(response.data.analysis);

      // Clean up the temporary file
      await FileSystem.deleteAsync(tempFilePath);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Axios error:', error.message);
        console.error('Error code:', error.code);
        console.error('Error response:', error.response);
        if (error.request) {
          console.error('Error request:', error.request);
        }
      } else {
        console.error('Unexpected error:', error);
      }
      setAnalysis('Failed to analyze image. Please try again.');
    }
    finally {
      setLoading(false);
    }
  };

  if (cameraPermission === null) {
    return <View />;
  }
  if (cameraPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      {capturedImage ? (
        <View style={styles.resultsContainer}>
          <Image source={{ uri: capturedImage.uri }} style={styles.capturedImage} />
          {loading ? (

            <View>
              <ActivityIndicator size="large" color="#0000ff" />
              <Text style={styles.analysisText}>Analyzing...this may take a few seconds</Text>
            </View>

          ) : (
            <View>
              <Text style={styles.analysisText}>{analysis || 'Analyzing...'}</Text>
                        <TouchableOpacity style={styles.button} onPress={() => setCapturedImage(null)}>
              <Text style={styles.buttonText}>Take Another Picture</Text>
                        </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        <View style={StyleSheet.absoluteFill}>
          <CameraView
            style={styles.camera}
            ref={camera}
          >
            <View style={styles.buttonContainer}>

              {/* Overlay with corner borders */}
              <View style={styles.overlayContainer}>
                <View style={styles.overlayBox}>
                  <View style={styles.cornerTopLeft}></View>
                  <View style={styles.cornerTopRight}></View>
                  <View style={styles.cornerBottomLeft}></View>
                  <View style={styles.cornerBottomRight}></View>
                </View>
              </View>
              <TouchableOpacity style={styles.button} onPress={takePicture}>
                <Text style={styles.buttonText}>Take Picture</Text>
              </TouchableOpacity>
            </View>
          </CameraView>
        </View>
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'center',
    margin: 20,
  },
  button: {
    alignSelf: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 15,
    borderRadius: 5,
    marginBottom: 20,
  },
  buttonText: {
    fontSize: 18,
    color: 'white',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    resizeMode: 'contain',
  },
  resultsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'white',
  },
  capturedImage: {
    width: 300,
    height: 400,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  analysisText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayBox: {
    width: 300, // Adjust the size
    height: 600, // Adjust the size
    position: 'relative',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40, // Adjust corner size
    height: 40, // Adjust corner size
    borderTopWidth: 5,
    borderLeftWidth: 5,
    borderColor: 'white',
  },
  cornerTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40, // Adjust corner size
    height: 40, // Adjust corner size
    borderTopWidth: 5,
    borderRightWidth: 5,
    borderColor: 'white',
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 40, // Adjust corner size
    height: 40, // Adjust corner size
    borderBottomWidth: 5,
    borderLeftWidth: 5,
    borderColor: 'white',
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40, // Adjust corner size
    height: 40, // Adjust corner size
    borderBottomWidth: 5,
    borderRightWidth: 5,
    borderColor: 'white',
  },
});