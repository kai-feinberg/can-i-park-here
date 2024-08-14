import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { Camera, CameraView } from 'expo-camera'; // Ensure this imports the Camera component
import * as ImageManipulator from 'expo-image-manipulator';
import { CameraType } from 'expo-camera/build/legacy/Camera.types';

export default function App() {
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const camera = useRef<any>(null); // Use the imported Camera type

  const [capturedImage, setCapturedImage] = useState<ImageManipulator.ImageResult | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);

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
            analyzeImage(manipResult.base64);
          }
        }
      } catch (error) {
        console.error('Error taking picture:', error);
      }
    }
  };

  const analyzeImage = async (base64Image: string) => {
    try {
      const response = await fetch('http://192.168.1.16:3000/analyze-sign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: base64Image }),
      });
      
      console.log('Response:', response);
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data: { analysis: string } = await response.json();
      setAnalysis(data.analysis);
    } catch (error) {
      console.error('Error:', error);
      setAnalysis('Failed to analyze image. Please try again.');
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
          <Text style={styles.analysisText}>{analysis || 'Analyzing...'}</Text>
          <TouchableOpacity style={styles.button} onPress={() => setCapturedImage(null)}>
            <Text style={styles.buttonText}>Take Another Picture</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={StyleSheet.absoluteFill}>
          <CameraView 
            style={styles.camera}
            ref={camera}
          >
            <View style={styles.buttonContainer}>
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
});