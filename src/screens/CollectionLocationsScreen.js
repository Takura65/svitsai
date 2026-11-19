import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";

import { COLORS } from "../theme/colors";
import {
  getCollectionLocations,
  addCollectionLocation,
  getSelectedLocationId,
  setSelectedLocationId,
} from "../services/collectionLocationStorage";

export default function CollectionLocationsScreen({ onBack }) {
  const [locations, setLocations] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [hours, setHours] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [list, activeId] = await Promise.all([
        getCollectionLocations(),
        getSelectedLocationId(),
      ]);
      setLocations(list);
      setSelectedId(activeId);
    } catch (error) {
      console.error("Load locations error:", error);
      Alert.alert("Error", "Unable to load collection locations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectLocation = async (locationId) => {
    setSelectedId(locationId);
    await setSelectedLocationId(locationId);
  };

  const handleAddLocation = async () => {
    if (!name.trim() || !city.trim() || !address.trim()) {
      Alert.alert(
        "Missing Details",
        "Please enter location name, city, and street address."
      );
      return;
    }

    try {
      setSaving(true);
      const updated = await addCollectionLocation({
        name,
        city,
        address,
        hours,
        phone,
      });
      setLocations(updated);
      setName("");
      setCity("");
      setAddress("");
      setHours("");
      setPhone("");
      setShowAddForm(false);
      Alert.alert("Added", "New collection location saved.");
    } catch (error) {
      Alert.alert("Error", error.message || "Could not add location.");
    } finally {
      setSaving(false);
    }
  };

  const query = search.trim().toLowerCase();
  const filteredLocations = query
    ? locations.filter(
        (loc) =>
          loc.name.toLowerCase().includes(query) ||
          loc.city.toLowerCase().includes(query) ||
          loc.address.toLowerCase().includes(query)
      )
    : locations;

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={onBack}>
          <Text style={styles.backButton}>← Back</Text>
        </Pressable>

        <Text style={styles.brand}>Svitsai</Text>

        <View style={{ width: 45 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.eyebrow}>PICKUP POINTS</Text>
        <Text style={styles.title}>Collection Locations</Text>
        <Text style={styles.subtitle}>
          Find Svitsai collection depots, operating hours, and set your
          preferred pickup hub.
        </Text>

        {/* SEARCH + TOGGLE ADD FORM */}
        <View style={styles.searchCard}>
          <Text style={styles.label}>Search by City, Depot, or Street</Text>
          <TextInput
            style={styles.input}
            value={search}
            onChangeText={setSearch}
            placeholder="e.g. Harare, Borrowdale, Bulawayo"
            placeholderTextColor="#999999"
          />

          <TouchableOpacity
            style={styles.toggleFormButton}
            activeOpacity={0.8}
            onPress={() => setShowAddForm((prev) => !prev)}
          >
            <Text style={styles.toggleFormText}>
              {showAddForm ? "− Hide Add Location Form" : "+ Add Collection Point"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ADD NEW LOCATION FORM */}
        {showAddForm && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>New Collection Location</Text>

            <Text style={styles.label}>Depot / Point Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Avondale Pickup Hub"
              placeholderTextColor="#999999"
            />

            <Text style={styles.label}>City *</Text>
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholder="e.g. Harare"
              placeholderTextColor="#999999"
            />

            <Text style={styles.label}>Street Address *</Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="e.g. 12 King George Rd"
              placeholderTextColor="#999999"
            />

            <Text style={styles.label}>Operating Hours</Text>
            <TextInput
              style={styles.input}
              value={hours}
              onChangeText={setHours}
              placeholder="Mon–Sat: 08:00 – 17:30"
              placeholderTextColor="#999999"
            />

            <Text style={styles.label}>Contact Phone</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+263 242 000 000"
              placeholderTextColor="#999999"
              keyboardType="phone-pad"
            />

            <TouchableOpacity
              style={[styles.primaryButton, saving && styles.disabled]}
              activeOpacity={0.8}
              onPress={handleAddLocation}
              disabled={saving}
            >
              <Text style={styles.primaryButtonText}>
                {saving ? "Saving..." : "Save Location"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* LIST HEADER */}
        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>Available Depots</Text>
          <Text style={styles.count}>{filteredLocations.length}</Text>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
            style={{ marginTop: 25 }}
          />
        ) : filteredLocations.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📍</Text>
            <Text style={styles.emptyTitle}>No Matching Locations</Text>
            <Text style={styles.emptyText}>
              Try clearing your search or add a new collection point.
            </Text>
          </View>
        ) : (
          filteredLocations.map((loc) => {
            const isSelected = loc.id === selectedId;
            return (
              <View
                key={loc.id}
                style={[styles.locCard, isSelected && styles.selectedLocCard]}
              >
                <View style={styles.locTopRow}>
                  <View style={styles.locIconBox}>
                    <Text style={styles.locIcon}>📍</Text>
                  </View>

                  <View style={styles.locHeading}>
                    <Text style={styles.locName}>{loc.name}</Text>
                    <Text style={styles.locCity}>{loc.city}</Text>
                  </View>

                  <View style={styles.statusPill}>
                    <Text style={styles.statusPillText}>{loc.status}</Text>
                  </View>
                </View>

                <Text style={styles.detailText}>{loc.address}</Text>
                <Text style={styles.metaText}>Hours: {loc.hours}</Text>
                <Text style={styles.metaText}>Phone: {loc.phone}</Text>

                <TouchableOpacity
                  style={[
                    styles.selectBtn,
                    isSelected && styles.selectBtnActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => handleSelectLocation(loc.id)}
                >
                  <Text
                    style={[
                      styles.selectBtnText,
                      isSelected && styles.selectBtnTextActive,
                    ]}
                  >
                    {isSelected ? "✓ Preferred Pickup Point" : "Set as Preferred"}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}

        <Text style={styles.footer}>
          Svitsai · Send with confidence.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    color: COLORS.primary,
    fontWeight: "600",
    fontSize: 15,
  },
  brand: {
    color: COLORS.primary,
    fontSize: 21,
    fontWeight: "bold",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  eyebrow: {
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: 11,
    letterSpacing: 1.5,
  },
  title: {
    color: COLORS.text,
    fontSize: 27,
    fontWeight: "bold",
    marginTop: 8,
  },
  subtitle: {
    color: "#666666",
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 20,
  },
  searchCard: {
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 16,
    marginBottom: 18,
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 12,
  },
  label: {
    color: COLORS.text,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D8DFD5",
    borderRadius: 10,
    padding: 13,
    color: COLORS.text,
    backgroundColor: "#FFFFFF",
  },
  toggleFormButton: {
    marginTop: 14,
    backgroundColor: COLORS.surface,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  toggleFormText: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 18,
  },
  disabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  count: {
    backgroundColor: COLORS.surface,
    color: COLORS.primary,
    fontWeight: "bold",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 25,
    alignItems: "center",
  },
  emptyIcon: {
    fontSize: 34,
    marginBottom: 8,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyText: {
    color: "#777777",
    textAlign: "center",
    marginTop: 6,
  },
  locCard: {
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 15,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#EBEBEB",
  },
  selectedLocCard: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  locTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  locIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  locIcon: {
    fontSize: 20,
  },
  locHeading: {
    flex: 1,
  },
  locName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "bold",
  },
  locCity: {
    color: "#777777",
    fontSize: 12,
    marginTop: 2,
  },
  statusPill: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPillText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "700",
  },
  detailText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  metaText: {
    color: "#666666",
    fontSize: 12,
    marginTop: 2,
  },
  selectBtn: {
    marginTop: 14,
    backgroundColor: COLORS.surface,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: "center",
  },
  selectBtnActive: {
    backgroundColor: COLORS.primary,
  },
  selectBtnText: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 13,
  },
  selectBtnTextActive: {
    color: "#FFFFFF",
  },
  footer: {
    textAlign: "center",
    color: "#999999",
    fontSize: 12,
    marginTop: 24,
  },
});