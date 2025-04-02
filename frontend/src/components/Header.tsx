import { Box, Image, HStack, Text, Button } from '@chakra-ui/react';
import { isDevelopment } from '../config';

interface HeaderProps {
  username: string;
  onLogout: () => void;
}

const Header = ({ username, onLogout }: HeaderProps) => {
  return (
    <Box
      as="header"
      bg="white"
      boxShadow="sm"
      px={6}
      py={4}
      width="100%"
    >
      <HStack justify="space-between" align="center">
        <HStack spacing={4}>
          <Image
            src="https://cdn.prod.website-files.com/65fb6879daa39a1a5c6273fa/65fb68ae5a899e6e9a042ab0_ommni--logo-orange-p-500.png"
            alt="OMMNI Logo"
            height="40px"
            objectFit="contain"
          />
          <Text fontSize="xl" fontWeight="bold" color="orange.500">
            Coin Group App
          </Text>
        </HStack>
        <HStack spacing={4}>
          <Text color="gray.600">Welcome, {username}</Text>
          <Button
            colorScheme="orange"
            variant="outline"
            size="sm"
            onClick={onLogout}
          >
            Logout
          </Button>
        </HStack>
      </HStack>
    </Box>
  );
};

export default Header; 