import React, { useRef, useState } from 'react';
import { View, StyleSheet, PanResponder, GestureResponderEvent } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface Point {
    x: number;
    y: number;
}

export type Stroke = Point[];

interface WritingCanvasProps {
    onStrokesChanged: (strokes: Stroke[]) => void;
    width?: number;
    height?: number;
}

export const WritingCanvas: React.FC<WritingCanvasProps> = ({ 
    onStrokesChanged, 
    width = 300, 
    height = 300 
}) => {
    const [paths, setPaths] = useState<string[]>([]);
    const [currentPath, setCurrentPath] = useState<string>('');
    
    // Store raw points for processing
    const strokes = useRef<Stroke[]>([]);
    const currentStroke = useRef<Stroke>([]);
    
    // Use ref for synchronous access in PanResponder callbacks
    const currentPathRef = useRef<string>('');

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (evt: GestureResponderEvent) => {
                const { locationX, locationY } = evt.nativeEvent;
                currentStroke.current = [{ x: locationX, y: locationY }];
                
                const newPath = `M${locationX},${locationY}`;
                currentPathRef.current = newPath; 
                setCurrentPath(newPath);
            },
            onPanResponderMove: (evt: GestureResponderEvent) => {
                const { locationX, locationY } = evt.nativeEvent;
                currentStroke.current.push({ x: locationX, y: locationY });
                
                const newPathSegment = ` L${locationX},${locationY}`;
                currentPathRef.current += newPathSegment;
                setCurrentPath(currentPathRef.current);
            },
            onPanResponderRelease: () => {
                if (currentPathRef.current) {
                    const finishedPath = currentPathRef.current;
                    setPaths(prev => [...prev, finishedPath]);
                    
                    strokes.current.push([...currentStroke.current]);
                    
                    currentPathRef.current = '';
                    setCurrentPath('');
                    
                    onStrokesChanged([...strokes.current]);
                }
            },
        })
    ).current;

    const clearCanvas = () => {
        setPaths([]);
        setCurrentPath('');
        currentPathRef.current = '';
        strokes.current = [];
        onStrokesChanged([]);
    };

    // Expose clear method via ref if needed, but for now simple imperative structure
    // actually, better to lift state up or use `useImperativeHandle` if parent controls clear.
    // For simplicity, we can pass a "reset key" prop or similar from parent? 
    // Or just let parent pass a ref. 
    // Let's attach a cleanup function to the component instance if we could, but functional components...
    // Let's modify props to include a `ref` forwarding or just use a `key` to reset in parent.
    
    return (
        <View 
            style={[styles.container, { width, height }]}
            {...panResponder.panHandlers}
        >
            <Svg height={height} width={width} style={styles.svg}>
                {paths.map((d, index) => (
                    <Path
                        key={index}
                        d={d}
                        stroke="black"
                        strokeWidth={15}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                ))}
                {currentPath ? (
                     <Path
                        d={currentPath}
                        stroke="black"
                        strokeWidth={15}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                ) : null}
            </Svg>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        overflow: 'hidden',
    },
    svg: {
        backgroundColor: 'transparent',
    }
});
