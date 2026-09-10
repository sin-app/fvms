import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:fvms_flutter/features/auth/bloc/auth_bloc.dart';
import 'package:fvms_flutter/widgets/brand_widgets.dart';
import 'package:go_router/go_router.dart';

class ResetPage extends StatefulWidget {
  const ResetPage({super.key});
  @override
  State<ResetPage> createState() => _ResetPageState();
}

class _ResetPageState extends State<ResetPage> {
  final _email = TextEditingController();

  @override
  void dispose() {
    _email.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Reset Password')),
      body: BlocConsumer<AuthBloc, AuthState>(
        listener: (c, s) {
          if (s is AuthFailure) ScaffoldMessenger.of(c).showSnackBar(SnackBar(content: Text(s.message)));
        },
        builder: (c, s) => Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              TextField(controller: _email, decoration: const InputDecoration(labelText: 'Email', border: OutlineInputBorder())),
              const SizedBox(height: 16),
              BrandButton(
                label: 'Kirim Link Reset',
                loading: s is AuthLoading,
                onPressed: () {
                  if (_email.text.isEmpty) return;
                  c.read<AuthBloc>().add(AuthResetRequested(_email.text.trim()));
                },
              ),
              TextButton(onPressed: () => context.go('/login'), child: const Text('Kembali ke Login')),
            ],
          ),
        ),
      ),
    );
  }
}
