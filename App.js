import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';

const SignIn = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = () => {
    if (email.length === 0 || password.length === 0) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }
    // Mock authentication
    // In a real application, replace this with authentication logic (e.g., Firebase, your own backend)
    Alert.alert('Success', 'Logged in successfully!');
    navigation.navigate('HomePage'); // Navigate to home page
  };

  return (
    <View style={styles.container}>
      <Image source={require('./assets/logo.png')} style={styles.logo} />
      <Text style={styles.title}>Sign In</Text>
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholderTextColor="#9CA3AF"
        />
        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholderTextColor="#9CA3AF"
        />
        <TouchableOpacity style={styles.button} onPress={handleSignIn}>
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.footer}>
        <Text style={styles.signUpText}>
          Don't have an account? <Text style={styles.signUpLink}>Sign Up</Text>
        </Text>
        <TouchableOpacity onPress={() => Alert.alert('Forgot Password', 'Forgot Password pressed')}>
          <Text style={styles.forgotPassword}>Forgot your password?</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 16,
  },
  logo: {
    width: 200,  // Adjust size as needed
    height: 100, // Adjust size as needed
    marginBottom: 24,
    objectFit:"contain"
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: '#1F2937',
  },
  form: {
    width: '100%',
    maxWidth: 400,
  },
  input: {
    height: 48,
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#6D28D9',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 3,
    marginBottom: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 18,
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  signUpText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  signUpLink: {
    color: '#6D28D9',
    textDecorationLine: 'underline',
  },
  forgotPassword: {
    marginTop: 8,
    fontSize: 14,
    color: '#6D28D9',
    textDecorationLine: 'underline',
  },
});

export default SignIn;