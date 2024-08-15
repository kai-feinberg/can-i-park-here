import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

export default function AboutMe() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>About</Text>
      <Text style={styles.subHeader}>Hey I'm Kai. I built this thing!</Text>
      <Text style={styles.text}>
        I'm a Northwestern Engineering/CS student who got tired of trying to decipher cryptic parking signs. I built this app to help people find parking in an accessible and easy way. Enjoy (its free)!
      </Text>
      <Text style={styles.subHeader}>How does it work?</Text>
      <Text style={styles.text}>
        When you take a picture of a parking sign, the app uses OpenAI's gpt-4o-mini model to analyze the image and provide you with information about the parking rules. The app will tell you if you can park there, when you can park there, and if there are any restrictions. If the app is unable to analyze the image, it will let you know. The app was built in 2 days with Expo and React Native.
      </Text>

      <Text style={styles.subHeader}>Contact me</Text>
      <Text style={styles.text}>
        If you have any questions or feedback or want to hire me you can reach me at kaifeinberg2025@u.northwestern.edu

        {"\n"}
        {"\n"}
        {"\n"}
      </Text>

      <Text style={styles.text}>
        Lastly, shoutout my mom!
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    paddingTop: 100, // Added padding at the top
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subHeader: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
  },
});
