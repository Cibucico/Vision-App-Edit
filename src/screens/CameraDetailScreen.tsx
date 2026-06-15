import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors, Typography, Spacing, Radius } from '../theme';
import { Camera } from '../store';
import { BackButton, Card, ToggleRow, SectionLabel } from '../components';

// NOTE: In production, install react-native-vlc-media-player
// import VLCPlayer from 'react-native-vlc-media-player';
// import { VLCOptions } from '../services/cameraService';

const { width } = Dimensions.get('window');

export const CameraDetailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const camera: Camera = route.params?.camera;

  const [motionEnabled, setMotionEnabled] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayback, setIsPlayback] = useState(false);

  if (!camera) return null;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Top Bar */}
      <View style={styles.topbar}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.title}>{camera.name}</Text>
          <Text style={styles.sub}>{camera.model} · {camera.type === 'outdoor' ? 'Outdoor' : 'Indoor'}</Text>
        </View>
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      {/* Camera Feed */}
      <View style={styles.feedContainer}>
        {camera.status === 'offline' ? (
          <View style={styles.offlineFeed}>
            <Text style={{ fontSize: 36 }}>📡</Text>
            <Text style={styles.offlineText}>Camera offline</Text>
            <Text style={styles.offlineSub}>Last seen: 23 min ago</Text>
          </View>
        ) : (
          <>
            {/*
              Production RTSP player:
              <VLCPlayer
                style={StyleSheet.absoluteFill}
                source={{ uri: camera.rtspUrl, initOptions: VLCOptions.android }}
                videoAspectRatio="16:9"
                onError={(e) => console.log('VLC Error:', e)}
                onProgress={(e) => console.log('Progress:', e)}
              />
            */}
            {/* Placeholder feed */}
            <View style={styles.feedBg} />
            <View style={styles.feedOverlayTop}>
              <View style={styles.wiseSenseBadge}>
                <Text style={styles.wiseSenseText}>🧠 WizSense</Text>
              </View>
            </View>
            {camera.status === 'motion' && (
              <View style={styles.motionBox} />
            )}
            <View style={styles.feedOverlayBottom}>
              <Text style={styles.feedCamInfo}>{camera.model} · {camera.ipRating || 'Indoor'}</Text>
              <View style={styles.feedBtns}>
                <TouchableOpacity
                  style={[styles.feedBtn, isRecording && { backgroundColor: 'rgba(255,68,85,0.3)' }]}
                  onPress={() => setIsRecording(r => !r)}
                >
                  <Text style={[styles.feedBtnText, isRecording && { color: Colors.red }]}>
                    {isRecording ? '⏹ Stop' : '⏺ Rec'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.feedBtn}>
                  <Text style={styles.feedBtnText}>⛶ Full</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={[styles.ctrlBtn, isPlayback && styles.ctrlBtnActive]} onPress={() => setIsPlayback(p => !p)}>
          <Text style={styles.ctrlBtnText}>⏮ Playback</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.ctrlBtn}>
          <Text style={styles.ctrlBtnText}>💾 Save clip</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.ctrlBtn}>
          <Text style={styles.ctrlBtnText}>↗ Share</Text>
        </TouchableOpacity>
      </View>

      {/* Timeline */}
      <View style={styles.timelineWrap}>
        <Text style={styles.tlLabel}>Recording timeline</Text>
        <View style={styles.timeline}>
          {/* Motion events */}
          <View style={[styles.tlEvent, { left: '15%', width: '8%', backgroundColor: 'rgba(255,68,85,0.5)' }]} />
          <View style={[styles.tlEvent, { left: '34%', width: '4%', backgroundColor: 'rgba(255,68,85,0.5)' }]} />
          <View style={[styles.tlEvent, { left: '55%', width: '12%', backgroundColor: 'rgba(255,170,0,0.4)' }]} />
          {/* Playhead */}
          <View style={styles.tlThumb} />
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Camera Details */}
        <View style={styles.detailGrid}>
          <View style={styles.detailCell}>
            <Text style={styles.detailLbl}>Resolution</Text>
            <Text style={styles.detailVal}>{camera.resolution}</Text>
          </View>
          <View style={styles.detailCell}>
            <Text style={styles.detailLbl}>Night vision</Text>
            <Text style={styles.detailVal}>{camera.hasNightVision ? 'Full-colour 40m' : 'None'}</Text>
          </View>
          <View style={styles.detailCell}>
            <Text style={styles.detailLbl}>IP rating</Text>
            <Text style={styles.detailVal}>{camera.ipRating || 'Indoor'}</Text>
          </View>
          <View style={styles.detailCell}>
            <Text style={styles.detailLbl}>AI detection</Text>
            <Text style={styles.detailVal}>{camera.hasAI ? 'WizSense · SMD' : 'None'}</Text>
          </View>
        </View>

        {/* Motion Zones */}
        <SectionLabel label="Motion detection" />
        <Card style={{ marginBottom: 16 }}>
          <ToggleRow
            label="Motion detection"
            subtitle="AI person & vehicle only"
            value={motionEnabled}
            onChange={setMotionEnabled}
          />
          <View style={styles.sensitivityRow}>
            <Text style={styles.sensitivityLabel}>Alert sensitivity</Text>
            <Text style={styles.sensitivitySub}>High · 3 zones active</Text>
            <TouchableOpacity>
              <Text style={styles.editLink}>Edit ›</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  topbar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
  },
  title: { fontFamily: Typography.display, fontSize: 17, color: Colors.text },
  sub: { fontSize: 11, color: Colors.muted, marginTop: 1 },
  livePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: Radius.pill,
    paddingHorizontal: 9, paddingVertical: 4,
    borderWidth: 0.5, borderColor: 'rgba(16,230,138,0.3)',
  },
  liveDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: Colors.green },
  liveText: { fontSize: 9, color: Colors.green, fontFamily: Typography.display, letterSpacing: 0.6 },
  feedContainer: {
    width: '100%', aspectRatio: 16 / 9,
    backgroundColor: '#04060C', position: 'relative', overflow: 'hidden',
  },
  feedBg: { ...StyleSheet.absoluteFillObject, backgroundColor: '#04060C' },
  offlineFeed: {
    ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  offlineText: { fontFamily: Typography.display, fontSize: 15, color: Colors.muted },
  offlineSub: { fontSize: 11, color: Colors.dim },
  feedOverlayTop: { position: 'absolute', top: 8, right: 10 },
  wiseSenseBadge: {
    backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 7,
    paddingHorizontal: 9, paddingVertical: 4,
  },
  wiseSenseText: { fontSize: 10, color: Colors.amber, fontFamily: Typography.display },
  motionBox: {
    position: 'absolute', left: '30%', top: '20%', width: '28%', height: '55%',
    borderWidth: 1.5, borderColor: Colors.red, borderRadius: 3,
  },
  feedOverlayBottom: {
    position: 'absolute', bottom: 8, left: 10, right: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  feedCamInfo: {
    fontSize: 9, color: 'rgba(240,242,248,0.7)',
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2, fontFamily: Typography.display,
  },
  feedBtns: { flexDirection: 'row', gap: 6 },
  feedBtn: {
    backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 7,
    paddingHorizontal: 9, paddingVertical: 5,
  },
  feedBtnText: { fontSize: 10, color: Colors.text, fontFamily: Typography.display },
  controls: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  ctrlBtn: {
    flex: 1, backgroundColor: Colors.surface2,
    borderWidth: 0.5, borderColor: Colors.border,
    borderRadius: 9, paddingVertical: 8,
    alignItems: 'center',
  },
  ctrlBtnActive: { backgroundColor: Colors.blueDim, borderColor: Colors.blueGlow },
  ctrlBtnText: { fontSize: 11, color: Colors.text, fontFamily: Typography.display },
  timelineWrap: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 4 },
  tlLabel: {
    fontFamily: Typography.display, fontSize: 10, color: Colors.muted,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6,
  },
  timeline: {
    height: 36, backgroundColor: Colors.surface2,
    borderRadius: 8, overflow: 'hidden',
    borderWidth: 0.5, borderColor: Colors.border,
  },
  tlEvent: { position: 'absolute', top: 6, height: 24, borderRadius: 3 },
  tlThumb: {
    position: 'absolute', top: 0, bottom: 0, left: '60%', width: 2,
    backgroundColor: Colors.blue,
  },
  scroll: { flex: 1, paddingHorizontal: 14 },
  detailGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
    paddingVertical: Spacing.sm,
  },
  detailCell: {
    width: '48%', backgroundColor: Colors.surface2,
    borderRadius: 8, padding: 10,
  },
  detailLbl: { fontSize: 10, color: Colors.muted },
  detailVal: { fontSize: 13, fontFamily: Typography.bodyMed, color: Colors.text, marginTop: 2 },
  sensitivityRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12,
  },
  sensitivityLabel: { fontSize: 13, color: Colors.text, flex: 1 },
  sensitivitySub: { fontSize: 11, color: Colors.muted },
  editLink: { fontSize: 11, color: Colors.blue, marginLeft: 8 },
});
