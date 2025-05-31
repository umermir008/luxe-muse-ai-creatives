
'use client';

import { useState, FormEvent, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Wand2, Ratio, FileSliders, Palette, Brain, Zap } from 'lucide-react';
import { enhancePrompt as enhancePromptFlow } from '@/ai/flows/enhance-prompt';
import type { Creation } from '@/types/creations';
import { useAuth } from '@/contexts/auth-context';
import { functions, db } from '@/firebase-config';
import { httpsCallable } from 'firebase/functions';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';

const stylePresets = [
  { id: 'none', label: 'None (Default)', addition: '' },
  { id: 'opulent-gold', label: 'Opulent Gold', addition: ', intricate details, baroque, gold filigree, rich textures, dramatic lighting, hyperrealistic, 8k' },
  { id: 'minimalist-elegance', label: 'Minimalist Elegance', addition: ', clean lines, muted color palette, subtle textures, modern, sophisticated, cinematic lighting' },
  { id: 'cyber-luxe', label: 'Cyber-Luxe', addition: ', futuristic, sleek, metallic, chrome accents, neon highlights, high-tech, cyberpunk aesthetic, vibrant colors, glowing edges' },
  { id: 'art-deco-dream', label: 'Art Deco Dream', addition: ', art deco style, geometric patterns, symmetrical, luxurious materials, polished metals, rich jewel tones, glamorous' },
  { id: 'vintage-luxe', label: 'Vintage Luxe', addition: ', classic film noir, glamorous, velvet textures, antique gold, moody lighting, 1920s style, cinematic' },
];

const aspectRatios = [
  { id: '1:1', label: 'Square (1:1)', width: 512, height: 512 },
  { id: '4:5', label: 'Portrait (4:5)', width: 512, height: 640 },
  { id: '16:9', label: 'Landscape (16:9)', width: 512, height: 288 },
  { id: '9:16', label: 'Story (9:16)', width: 288, height: 512 },
  { id: '3:2', label: 'Photo (3:2)', width: 512, height: 341 },
];

const colorPalettes = [
  { id: 'default', label: 'Default Palette' },
  { id: 'vibrant', label: 'Vibrant Colors' },
  { id: 'muted', label: 'Muted Tones' },
  { id: 'monochrome', label: 'Monochrome' },
  { id: 'pastel', label: 'Pastel Dreams' },
  { id: 'metallic', label: 'Metallic Sheen' },
];


const generateAiImageFunction = httpsCallable(functions, 'generateAiImage');

export default function OwnerGeneratePage() {
  const { user, userDoc, refreshUserDoc } = useAuth(); 
  const { toast } = useToast();

  const [prompt, setPrompt] = useState('');
  const [enhancedPrompt, setEnhancedPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(stylePresets[0].id);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState(aspectRatios[0].id);
  
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generatedImageWidth, setGeneratedImageWidth] = useState<number>(aspectRatios[0].width);
  const [generatedImageHeight, setGeneratedImageHeight] = useState<number>(aspectRatios[0].height);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);

  const [creativity, setCreativity] = useState([50]);
  const [detailLevel, setDetailLevel] = useState([70]);
  const [selectedColorPalette, setSelectedColorPalette] = useState(colorPalettes[0].id);
  
  const ownerCreditsDisplay = userDoc?.credits === 999999 ? "Unlimited" : (userDoc?.credits ?? '...');


  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) {
      toast({
        variant: 'destructive',
        title: 'Empty Prompt',
        description: 'Please enter a prompt to enhance.',
      });
      return;
    }
    setIsEnhancing(true);
    try {
      const result = await enhancePromptFlow({ prompt });
      setEnhancedPrompt(result.enhancedPrompt);
      toast({ title: 'Prompt Enhanced', description: 'Your prompt has been styled for luxury.' });
    } catch (error) {
      console.error('Error enhancing prompt:', error);
      toast({
        variant: 'destructive',
        title: 'Enhancement Failed',
        description: 'Could not enhance prompt. Please try again.',
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleGenerateImage = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !userDoc) { 
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in as owner to generate images.' });
      return;
    }

    let basePrompt = enhancedPrompt || prompt;
    if (!basePrompt.trim()) {
      toast({
        variant: 'destructive',
        title: 'Empty Prompt',
        description: 'Please enter a prompt or enhance one to generate an image.',
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedImageUrl(null); 

    const currentStylePreset = stylePresets.find(p => p.id === selectedStyle) || stylePresets[0];
    let finalPromptForAI = basePrompt + currentStylePreset.addition;
    
    finalPromptForAI += ` (Creativity: ${creativity[0]}, Detail: ${detailLevel[0]}, Palette: ${selectedColorPalette})`;
        
    const currentAspectRatio = aspectRatios.find(ar => ar.id === selectedAspectRatio) || aspectRatios[0];
    setGeneratedImageWidth(currentAspectRatio.width); 
    setGeneratedImageHeight(currentAspectRatio.height);

    try {
      const result: any = await generateAiImageFunction({ 
        prompt: finalPromptForAI,
        negativePrompt: negativePrompt.trim() || undefined,
        aspectRatio: currentAspectRatio.id, // Pass the ID
      });
      
      if (result.data && result.data.imageUrl && result.data.creationId) {
        const { imageUrl: returnedImageUrl, creationId, imageWidth: actualWidth, imageHeight: actualHeight } = result.data;
        setGeneratedImageUrl(returnedImageUrl);
        setGeneratedImageWidth(actualWidth);
        setGeneratedImageHeight(actualHeight);
                
        toast({ title: 'Image Generated!', description: `Your masterpiece is ready.` });

        const newCreation: Creation = {
          id: creationId,
          userId: user.uid, 
          prompt: prompt, 
          enhancedPrompt: enhancedPrompt || undefined, 
          stylePresetName: currentStylePreset.id === 'none' ? undefined : currentStylePreset.label,
          aspectRatio: currentAspectRatio.label, // Save label for display
          negativePrompt: negativePrompt.trim() || undefined,
          imageUrl: returnedImageUrl, 
          createdAt: serverTimestamp(), 
          imageWidth: actualWidth,
          imageHeight: actualHeight,
          creativity: creativity[0],
          detailLevel: detailLevel[0],
          colorPalette: selectedColorPalette === 'default' ? undefined : selectedColorPalette,
        };

        const creationDocRef = doc(db, 'creations', creationId);
        await setDoc(creationDocRef, newCreation);
        
        if (userDoc.role === 'owner') await refreshUserDoc();

      } else {
        throw new Error(result.data?.message || "Image data not found in function response.");
      }

    } catch (error: any) {
      console.error('Error generating image:', error);
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: error.message || 'Could not generate image. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  useEffect(() => {
    if (!isGenerating && !generatedImageUrl) {
      const currentAspectRatio = aspectRatios.find(ar => ar.id === selectedAspectRatio) || aspectRatios[0];
      setGeneratedImageWidth(currentAspectRatio.width);
      setGeneratedImageHeight(currentAspectRatio.height);
    }
  }, [selectedAspectRatio, isGenerating, generatedImageUrl]);


  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-headline text-primary flex items-center">
            <Sparkles className="mr-3 h-8 w-8" /> AI Image Generation Studio (Owner)
          </CardTitle>
          <CardDescription className="text-lg text-foreground/80">
            Craft your vision with full control. Input prompts, select styles, and let the AI create.
            <span className="block mt-1 font-semibold text-primary">(Credits: {ownerCreditsDisplay})</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerateImage} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="prompt" className="text-base">Your Creative Prompt</Label>
              <Textarea
                id="prompt"
                placeholder="e.g., A golden lion made of light, regal, art deco style, dark background"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                className="bg-input text-base"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button type="button" variant="outline" onClick={handleEnhancePrompt} disabled={isEnhancing || isGenerating} className="w-full">
                {isEnhancing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="mr-2 h-4 w-4" />
                )}
                Enhance Prompt Style (Uses Genkit)
              </Button>
            </div>

            {enhancedPrompt && (
              <div className="space-y-2 p-4 border border-dashed border-primary rounded-md bg-primary/5">
                <Label htmlFor="enhanced-prompt" className="text-base text-primary">Enhanced Prompt</Label>
                <p id="enhanced-prompt" className="text-sm text-foreground/90 italic">{enhancedPrompt}</p>
                 <Button type="button" variant="link" size="sm" className="p-0 h-auto text-accent" onClick={() => {
                   setPrompt(enhancedPrompt);
                  }}>
                  Use this enhanced prompt
                </Button>
              </div>
            )}
            
            <Card className="bg-card/50 p-4 space-y-4">
              <h3 className="text-lg font-medium text-primary flex items-center"><Ratio className="mr-2 h-5 w-5" />Styling Options</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="style-preset">Luxury Style Preset</Label>
                  <Select value={selectedStyle} onValueChange={setSelectedStyle} disabled={isGenerating}>
                    <SelectTrigger id="style-preset">
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent>
                      {stylePresets.map(preset => (
                        <SelectItem key={preset.id} value={preset.id}>{preset.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aspect-ratio">Aspect Ratio</Label>
                  <Select value={selectedAspectRatio} onValueChange={setSelectedAspectRatio} disabled={isGenerating}>
                    <SelectTrigger id="aspect-ratio">
                      <SelectValue placeholder="Select aspect ratio" />
                    </SelectTrigger>
                    <SelectContent>
                      {aspectRatios.map(ratio => (
                        <SelectItem key={ratio.id} value={ratio.id}>{ratio.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="negative-prompt">Negative Prompt (Optional)</Label>
                <Textarea
                  id="negative-prompt"
                  placeholder="e.g., blurry, low-resolution, cartoon, ugly, deformed, text, watermark"
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  rows={2}
                  className="bg-input text-sm"
                  disabled={isGenerating}
                />
                <p className="text-xs text-muted-foreground">Describe what you *don't* want to see in the image.</p>
              </div>
            </Card>

             <Card className="bg-card/50 p-4 space-y-6">
                <h3 className="text-lg font-medium text-primary flex items-center"><Zap className="mr-2 h-5 w-5" />Advanced AI Controls</h3>
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <Label htmlFor="creativity-slider" className="flex items-center"><Brain className="mr-2 h-4 w-4 text-primary/80"/>Creativity</Label>
                        <span className="text-sm text-muted-foreground">{creativity[0]}%</span>
                    </div>
                    <Slider
                        id="creativity-slider"
                        min={0} max={100} step={1}
                        defaultValue={creativity}
                        onValueChange={setCreativity}
                        disabled={isGenerating}
                        className="[&>span:first-child]:h-2 [&>span:first-child>span]:bg-primary/80 [&>button]:border-primary/80"
                    />
                    <p className="text-xs text-muted-foreground">Lower values for more literal interpretations, higher for more abstract results.</p>
                </div>
                 <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <Label htmlFor="detail-level-slider" className="flex items-center"><FileSliders className="mr-2 h-4 w-4 text-primary/80"/>Detail Level</Label>
                        <span className="text-sm text-muted-foreground">{detailLevel[0]}%</span>
                    </div>
                    <Slider
                        id="detail-level-slider"
                        min={0} max={100} step={1}
                        defaultValue={detailLevel}
                        onValueChange={setDetailLevel}
                        disabled={isGenerating}
                        className="[&>span:first-child]:h-2 [&>span:first-child>span]:bg-primary/80 [&>button]:border-primary/80"
                    />
                    <p className="text-xs text-muted-foreground">Controls the amount of fine detail in the generated image.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color-palette" className="flex items-center"><Palette className="mr-2 h-4 w-4 text-primary/80"/>Color Palette</Label>
                  <Select value={selectedColorPalette} onValueChange={setSelectedColorPalette} disabled={isGenerating}>
                    <SelectTrigger id="color-palette">
                      <SelectValue placeholder="Select color palette" />
                    </SelectTrigger>
                    <SelectContent>
                      {colorPalettes.map(palette => (
                        <SelectItem key={palette.id} value={palette.id}>{palette.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                   <p className="text-xs text-muted-foreground">Guides the AI towards a specific color scheme (conceptual).</p>
                </div>
            </Card>
            
            <Button 
              type="submit" 
              disabled={isGenerating || (!prompt.trim() && !enhancedPrompt.trim())} 
              className="w-full md:w-auto"
              size="lg"
            >
              {isGenerating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Generate Image
            </Button>
          </form>

          {isGenerating && !generatedImageUrl && (
            <div className="mt-8 flex flex-col items-center justify-center space-y-4 p-8 border border-dashed border-border rounded-md">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Generating your masterpiece... this may take a moment.</p>
              <div 
                className="bg-muted rounded-md animate-pulse"
                style={{ 
                  width: `${generatedImageWidth}px`, 
                  height: `${generatedImageHeight}px`, 
                  maxWidth: '100%',
                  aspectRatio: `${generatedImageWidth}/${generatedImageHeight}`
                }}
                data-ai-hint="loading placeholder"
              ></div>
            </div>
          )}

          {generatedImageUrl && (
            <div className="mt-8 space-y-4">
              <h3 className="text-2xl font-headline text-primary">Your Generated Image</h3>
              <Card className="overflow-hidden shadow-md w-full mx-auto" style={{ maxWidth: `${generatedImageWidth}px`}}>
                <Image
                  src={generatedImageUrl}
                  alt={enhancedPrompt || prompt || 'Generated AI image'}
                  width={generatedImageWidth}
                  height={generatedImageHeight}
                  className="w-full h-auto object-contain rounded-md"
                  data-ai-hint="generated art"
                  priority
                />
              </Card>
               <Button asChild variant="outline">
                <Link href="/owner-dashboard/creations">View in My Creations</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

    