import * as React from 'react';
import { useEffect, useState } from 'react';

// Type for MIDIOutput (from Web MIDI API)
type MIDIOutput = {
    id: string;
    name: string;
};

interface KasmWindow extends Window {
    kasmWebMIDI?: {
        setCurrentMidiOutput: (id: string) => void;
    };
}

interface MidiSelectorProps {
    onDeviceChange?: (deviceId: string) => void;
    onChannelChange?: (channel: number) => void;
    initialDeviceId?: string;
    initialChannel?: number;
}

const MidiSelector: React.FC<MidiSelectorProps> = ({
    onDeviceChange,
    onChannelChange,
    initialDeviceId = '',
    initialChannel = 0,
}) => {
    const [midiDevices, setMidiDevices] = useState<MIDIOutput[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>(initialDeviceId);
    const [selectedChannel, setSelectedChannel] = useState<number>(initialChannel);

    const refreshMidiDevices = () => {
        if (navigator.requestMIDIAccess) {
            navigator.requestMIDIAccess().then(midiAccess => {
                const outputs: MIDIOutput[] = [];
                midiAccess.outputs.forEach((output: WebMidi.MIDIOutput) => {
                    outputs.push({ id: output.id, name: output.name ?? 'Unknown Device' });
                });
                setMidiDevices(outputs);
            }).catch(() => setMidiDevices([]));
        }
    };

    useEffect(() => {
        refreshMidiDevices();
    }, []);

    const handleDeviceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedDeviceId(e.target.value);
        const win = window as KasmWindow;
        if (win.kasmWebMIDI) {
            win.kasmWebMIDI.setCurrentMidiOutput(e.target.value);
        }
        if (onDeviceChange) onDeviceChange(e.target.value);
    };

    const handleChannelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const channel = Number(e.target.value);
        setSelectedChannel(channel);
        if (onChannelChange) onChannelChange(channel);
    };

    return (
        <div style={{ marginBottom: '10px' }}>
            <label>
                <select style={{ padding: '3px', marginLeft: '10px' }}
                    value={selectedDeviceId}
                    onChange={handleDeviceChange}>
                    <option value="">Select MIDI Device...</option>
                    {midiDevices.map(device => (
                        <option key={device.id} value={device.id}>{device.name}</option>
                    ))}
                </select>
            </label>
            <button style={{ marginLeft: '10px', padding: '3px 8px' }} onClick={refreshMidiDevices}>&lt;</button>
            <label style={{ marginLeft: '20px' }}>
                MIDI Channel:
                <select style={{ padding: '3px', width: '40px', marginLeft: '10px' }}
                    value={selectedChannel}
                    onChange={handleChannelChange}>
                    {[...Array(16)].map((_, i) => (
                        <option key={i} value={i}>{i + 1}</option>
                    ))}
                </select>
            </label>
        </div>
    );
};

export default MidiSelector;
