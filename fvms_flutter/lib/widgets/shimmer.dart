import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';

class ShimmerBox extends StatelessWidget {
  const ShimmerBox({required this.width, required this.height, super.key, this.radius = const BorderRadius.all(Radius.circular(12))});
  final double width;
  final double height;
  final BorderRadius radius;
  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: Colors.grey.shade300,
      highlightColor: const Color(0xFFECFDF5),
      child: Container(width: width, height: height, decoration: BoxDecoration(color: Colors.white, borderRadius: radius)),
    );
  }
}

class LoadingState extends StatelessWidget {
  const LoadingState({super.key});
  @override
  Widget build(BuildContext context) => Semantics(
        label: 'Memuat',
        child: ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: 6,
          separatorBuilder: (_, __) => const SizedBox(height: 12),
          itemBuilder: (_, __) => const ShimmerBox(width: double.infinity, height: 80),
        ),
      );
}

class ErrorState extends StatelessWidget {
  const ErrorState({required this.message, super.key, this.onRetry});
  final String message;
  final VoidCallback? onRetry;
  @override
  Widget build(BuildContext context) => Center(
        child: Semantics(
          liveRegion: true,
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            const Icon(Icons.error_outline, size: 48, color: Colors.red),
            const SizedBox(height: 8),
            Text(message, textAlign: TextAlign.center),
            if (onRetry != null) ...[
              const SizedBox(height: 12),
              FilledButton(onPressed: onRetry, child: const Text('Coba lagi')),
            ],
          ],),
        ),
      );
}

class EmptyState extends StatelessWidget {
  const EmptyState({super.key, this.message = 'Tidak ada data'});
  final String message;
  @override
  Widget build(BuildContext context) => Center(child: Text(message, style: Theme.of(context).textTheme.bodyLarge));
}
