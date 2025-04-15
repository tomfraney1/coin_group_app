import { ChakraProvider, Box, VStack, Text, Collapse, Icon, Link as ChakraLink, Flex, useColorModeValue } from '@chakra-ui/react'
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { ChevronDownIcon, ChevronRightIcon } from '@chakra-ui/icons'
import Login from './components/Login'
import Register from './components/Register'
import Header from './components/Header'
import CoinScanner from './components/CoinScanner'
import OMMNIUploader from './components/OmniUploader'
import CaseManagement from './components/CaseManagement'
import CaseDetails from './components/CaseDetails'
import StockTake from './components/StockTake'
import SpotPriceCalculator from './components/SpotPriceCalculator'
import { isDevelopment, developmentUser } from './config'

// Placeholder components for each service
const ShowStock = () => <Box>Show Stock Service</Box>
const Inventory = () => <Box>Inventory Service</Box>

// User Management Components
const UserManagement = () => <Box>User Management Overview</Box>
const UserList = () => <Box>User List</Box>
const UserRoles = () => <Box>User Roles</Box>

// Protected Route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const token = localStorage.getItem('token');

  if (!token && !isDevelopment) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

function App() {
  const [showStockOpen, setShowStockOpen] = useState(false)
  const [inventoryOpen, setInventoryOpen] = useState(false)
  const [userManagementOpen, setUserManagementOpen] = useState(false)
  const [spotPriceOpen, setSpotPriceOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  const sidebarBg = useColorModeValue('white', 'gray.800');
  const sidebarBorderColor = useColorModeValue('gray.200', 'gray.700');
  const linkColor = useColorModeValue('orange.500', 'orange.200');
  const linkHoverBg = useColorModeValue('orange.50', 'gray.700');

  useEffect(() => {
    // Check for user in localStorage and set it in state
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
      }
    }
    setIsLoading(false);
  }, []);

  // Listen for storage events to sync user state across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user') {
        if (e.newValue) {
          try {
            setUser(JSON.parse(e.newValue));
          } catch (error) {
            console.error('Error parsing user from storage event:', error);
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login';
  };

  const NavLink = ({ to, children }: { to: string; children: React.ReactNode }) => (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <Box
        px={4}
        py={2}
        borderRadius="md"
        _hover={{ bg: linkHoverBg }}
        color={linkColor}
        fontWeight="medium"
      >
        {children}
      </Box>
    </Link>
  );

  if (isLoading) {
    return null; // or a loading spinner
  }

  return (
    <ChakraProvider>
      <Router>
        <Box minH="100vh" bg="gray.50">
          {user ? (
            <Box>
              {/* Header */}
              <Header username={user.username} onLogout={handleLogout} />
              
              {/* Main Content with Sidebar */}
              <Flex>
                {/* Sidebar */}
                <Box
                  w="250px"
                  bg={sidebarBg}
                  borderRight="1px"
                  borderColor={sidebarBorderColor}
                  py={4}
                  px={4}
                  minH="calc(100vh - 72px)"
                  overflowY="auto"
                >
                  <VStack spacing={4} align="stretch">
                    {/* Coin Scanner Section */}
                    <Box>
                      <ChakraLink
                        onClick={() => setShowStockOpen(!showStockOpen)}
                        display="flex"
                        alignItems="center"
                        cursor="pointer"
                        color={linkColor}
                        px={4}
                        py={2}
                        borderRadius="md"
                        _hover={{ bg: linkHoverBg }}
                      >
                        <Text fontWeight="medium">Coin Scanner</Text>
                        <Icon
                          as={showStockOpen ? ChevronDownIcon : ChevronRightIcon}
                          ml={2}
                        />
                      </ChakraLink>
                      <Collapse in={showStockOpen}>
                        <VStack gap={2} align="stretch" pl={4} mt={2}>
                          <NavLink to="/coin-scanner">
                            <Text>Scanner</Text>
                          </NavLink>
                        </VStack>
                      </Collapse>
                    </Box>

                    <NavLink to="/ommni-uploader">
                      <Text>OMMNI Uploader</Text>
                    </NavLink>
                    
                    {/* Show Stock Section */}
                    <Box>
                      <ChakraLink
                        onClick={() => setShowStockOpen(!showStockOpen)}
                        display="flex"
                        alignItems="center"
                        cursor="pointer"
                        color={linkColor}
                        px={4}
                        py={2}
                        borderRadius="md"
                        _hover={{ bg: linkHoverBg }}
                      >
                        <Text fontWeight="medium">Show Stock</Text>
                        <Icon
                          as={showStockOpen ? ChevronDownIcon : ChevronRightIcon}
                          ml={2}
                        />
                      </ChakraLink>
                      <Collapse in={showStockOpen}>
                        <VStack gap={2} align="stretch" pl={4} mt={2}>
                          <NavLink to="/show-stock/case-management">
                            <Text>Case Management</Text>
                          </NavLink>
                          <NavLink to="/show-stock/stock-take">
                            <Text>Stock Take</Text>
                          </NavLink>
                        </VStack>
                      </Collapse>
                    </Box>

                    {/* Spot Price Calculator Section */}
                    <Box>
                      <ChakraLink
                        onClick={() => setSpotPriceOpen(!spotPriceOpen)}
                        display="flex"
                        alignItems="center"
                        cursor="pointer"
                        color={linkColor}
                        px={4}
                        py={2}
                        borderRadius="md"
                        _hover={{ bg: linkHoverBg }}
                      >
                        <Text fontWeight="medium">Spot Price Calculator</Text>
                        <Icon
                          as={spotPriceOpen ? ChevronDownIcon : ChevronRightIcon}
                          ml={2}
                        />
                      </ChakraLink>
                      <Collapse in={spotPriceOpen}>
                        <VStack gap={2} align="stretch" pl={4} mt={2}>
                          <NavLink to="/spot-price-calculator">
                            <Text>Calculator</Text>
                          </NavLink>
                        </VStack>
                      </Collapse>
                    </Box>

                    {/* Inventory Section */}
                    <Box>
                      <ChakraLink
                        onClick={() => setInventoryOpen(!inventoryOpen)}
                        display="flex"
                        alignItems="center"
                        cursor="pointer"
                        color={linkColor}
                        px={4}
                        py={2}
                        borderRadius="md"
                        _hover={{ bg: linkHoverBg }}
                      >
                        <Text fontWeight="medium">Inventory</Text>
                        <Icon
                          as={inventoryOpen ? ChevronDownIcon : ChevronRightIcon}
                          ml={2}
                        />
                      </ChakraLink>
                      <Collapse in={inventoryOpen}>
                        <VStack gap={2} align="stretch" pl={4} mt={2}>
                          <NavLink to="/inventory">
                            <Text>Overview</Text>
                          </NavLink>
                        </VStack>
                      </Collapse>
                    </Box>

                    {/* User Management Section */}
                    {user.role === 'admin' && (
                      <Box>
                        <ChakraLink
                          onClick={() => setUserManagementOpen(!userManagementOpen)}
                          display="flex"
                          alignItems="center"
                          cursor="pointer"
                          color={linkColor}
                          px={4}
                          py={2}
                          borderRadius="md"
                          _hover={{ bg: linkHoverBg }}
                        >
                          <Text fontWeight="medium">User Management</Text>
                          <Icon
                            as={userManagementOpen ? ChevronDownIcon : ChevronRightIcon}
                            ml={2}
                          />
                        </ChakraLink>
                        <Collapse in={userManagementOpen}>
                          <VStack gap={2} align="stretch" pl={4} mt={2}>
                            <NavLink to="/users">
                              <Text>Overview</Text>
                            </NavLink>
                            <NavLink to="/users/list">
                              <Text>User List</Text>
                            </NavLink>
                            <NavLink to="/users/roles">
                              <Text>User Roles</Text>
                            </NavLink>
                          </VStack>
                        </Collapse>
                      </Box>
                    )}
                  </VStack>
                </Box>

                {/* Main Content */}
                <Box flex="1">
                  <Box p={8}>
                    <Routes>
                      <Route path="/" element={<ProtectedRoute><CoinScanner /></ProtectedRoute>} />
                      <Route path="/coin-scanner" element={<ProtectedRoute><CoinScanner /></ProtectedRoute>} />
                      <Route path="/ommni-uploader" element={<ProtectedRoute><OMMNIUploader /></ProtectedRoute>} />
                      <Route path="/show-stock/case-management" element={<ProtectedRoute><CaseManagement /></ProtectedRoute>} />
                      <Route path="/show-stock/case-management/:caseId" element={<ProtectedRoute><CaseDetails /></ProtectedRoute>} />
                      <Route path="/show-stock/stock-take" element={<ProtectedRoute><StockTake /></ProtectedRoute>} />
                      <Route path="/spot-price-calculator" element={<ProtectedRoute><SpotPriceCalculator /></ProtectedRoute>} />
                      <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
                      <Route path="/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
                      <Route path="/users/list" element={<ProtectedRoute><UserList /></ProtectedRoute>} />
                      <Route path="/users/roles" element={<ProtectedRoute><UserRoles /></ProtectedRoute>} />
                    </Routes>
                  </Box>
                </Box>
              </Flex>
            </Box>
          ) : (
            <Box p={8}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </Box>
          )}
        </Box>
      </Router>
    </ChakraProvider>
  )
}

export default App
