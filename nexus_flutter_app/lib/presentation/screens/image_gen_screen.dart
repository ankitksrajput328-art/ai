import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../widgets/glass_card.dart';

class ImageGenScreen extends StatefulWidget {
  const ImageGenScreen({super.key});

  @override
  State<ImageGenScreen> createState() => _ImageGenScreenState();
}

class _ImageGenScreenState extends State<ImageGenScreen> {
  final TextEditingController _promptController = TextEditingController();
  String _selectedStyle = "Realistic";
  bool _isGenerating = false;
  String? _generatedImageUrl;

  final List<String> _styles = ["Realistic", "Anime", "Cyberpunk", "Oil Painting", "3D Render"];

  void _generateImage() async {
    if (_promptController.text.isEmpty) return;
    setState(() => _isGenerating = true);
    
    // In production: Call backend API /image/generate
    await Future.delayed(const Duration(seconds: 5));
    
    setState(() {
      _isGenerating = false;
      _generatedImageUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe"; // Placeholder
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("AI ART STUDIO")),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        children: [
          // Prompt Input
          TextField(
            controller: _promptController,
            maxLines: 3,
            decoration: InputDecoration(
              hintText: "Describe your imagination...",
              filled: true,
              fillColor: Colors.white.withOpacity(0.05),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: BorderSide.none),
            ),
          ),
          
          const SizedBox(height: 24),
          
          // Style Selector
          const Text("CHOOSE STYLE", style: TextStyle(fontSize: 12, letterSpacing: 2, color: Colors.white54)),
          const SizedBox(height: 12),
          SizedBox(
            height: 40,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: _styles.length,
              itemBuilder: (context, index) {
                final style = _styles[index];
                final isSelected = _selectedStyle == style;
                return GestureDetector(
                  onTap: () => setState(() => _selectedStyle = style),
                  child: Container(
                    margin: const EdgeInsets.only(right: 12),
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    decoration: BoxDecoration(
                      color: isSelected ? const Color(0xFF6366F1) : Colors.white.withOpacity(0.05),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    alignment: Alignment.center,
                    child: Text(style, style: TextStyle(color: isSelected ? Colors.white : Colors.white70, fontWeight: isSelected ? FontWeight.bold : FontWeight.normal)),
                  ),
                );
              },
            ),
          ),

          const SizedBox(height: 32),
          
          // Generate Button
          ElevatedButton(
            onPressed: _isGenerating ? null : _generateImage,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF6366F1),
              padding: const EdgeInsets.all(18),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            ),
            child: _isGenerating 
              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
              : const Text("GENERATE MASTERPIECE", style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 2)),
          ),

          const SizedBox(height: 40),

          // Result Display
          if (_generatedImageUrl != null) ...[
            ClipRRect(
              borderRadius: BorderRadius.circular(24),
              child: Image.network(_generatedImageUrl!, fit: BoxFit.cover),
            ).animate().fadeIn().scale(),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: Main_AxisAlignment.spaceEvenly,
              children: [
                _buildActionButton(Icons.download, "Save"),
                _buildActionButton(Icons.share, "Share"),
                _buildActionButton(Icons.auto_fix_high, "Enhance"),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildActionButton(IconData icon, String label) {
    return Column(
      children: [
        IconButton(onPressed: () {}, icon: Icon(icon, color: const Color(0xFF6366F1))),
        Text(label, style: const TextStyle(fontSize: 10, color: Colors.white54)),
      ],
    );
  }
}
