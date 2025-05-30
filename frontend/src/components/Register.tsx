import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Text,
  useToast,
  Heading,
  Image,
  Container,
  HStack,
} from '@chakra-ui/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await authService.register(username, email, password);

      toast({
        title: 'Registration successful',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      navigate('/');
    } catch (error: any) {
      toast({
        title: 'Registration failed',
        description: error.message || 'An error occurred',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="container.sm" py={10}>
      <VStack spacing={8} align="center">
        <HStack spacing={4}>
          <Image
            src="https://cdn.prod.website-files.com/65fb6879daa39a1a5c6273fa/65fb68ae5a899e6e9a042ab0_ommni--logo-orange-p-500.png"
            alt="OMMNI Logo"
            height="60px"
            objectFit="contain"
          />
          <Heading size="xl" color="orange.500">
            Coin Group App
          </Heading>
        </HStack>
        
        <Box
          w="full"
          maxW="md"
          p={8}
          borderWidth={1}
          borderRadius={8}
          boxShadow="lg"
          bg="white"
        >
          <VStack spacing={6} align="stretch">
            <Heading textAlign="center" size="lg" color="gray.700">
              Register
            </Heading>
            <form onSubmit={handleSubmit}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Username</FormLabel>
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a username"
                    size="lg"
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    size="lg"
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Password</FormLabel>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Choose a password"
                    size="lg"
                  />
                </FormControl>
                <Button
                  type="submit"
                  colorScheme="orange"
                  size="lg"
                  width="full"
                  isLoading={isLoading}
                >
                  Register
                </Button>
              </VStack>
            </form>
            <Text textAlign="center" color="gray.600">
              Already have an account?{' '}
              <Text
                as="span"
                color="orange.500"
                cursor="pointer"
                fontWeight="medium"
                onClick={() => navigate('/login')}
                _hover={{ textDecoration: 'underline' }}
              >
                Login
              </Text>
            </Text>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
};

export default Register; 