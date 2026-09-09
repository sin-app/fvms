import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:fvms_flutter/app/theme/brand.dart';
import 'package:fvms_flutter/core/supabase/client.dart';
import 'package:fvms_flutter/features/auth/bloc/auth_bloc.dart';
import 'package:fvms_flutter/widgets/brand_widgets.dart';
import 'package:go_router/go_router.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});
  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _email = TextEditingController();
  final _pass = TextEditingController();
  final _form = GlobalKey<FormState>();
  bool _obscure = true;

  @override
  void dispose() {
    _email.dispose();
    _pass.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: BlocConsumer<AuthBloc, AuthState>(
        listener: (c, s) {
          if (s is AuthAuthenticated) {
            if (ModalRoute.of(c)?.settings.name != '/') {
              // ignore: use_build_context_synchronously
              c.go('/');
            }
          }
        },
        builder: (c, s) {
          final loading = s is AuthLoading;
          final failure = s is AuthFailure ? s : null;
          return SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 400),
                  child: Form(
                    key: _form,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const Icon(Icons.spa_rounded, size: 64, color: BrandColors.brand),
                        const SizedBox(height: 12),
                        Text('FVMS', textAlign: TextAlign.center, style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.bold)),
                        Text('Field Visit Management System', textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.grey)),
                        if (!SupabaseConfig.isConfigured)
                          Container(
                            margin: const EdgeInsets.only(top: 12),
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(color: Colors.red.shade50, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.red.shade200)),
                            child: Row(children: [
                              const Icon(Icons.warning_amber_rounded, color: Colors.red, size: 20),
                              const SizedBox(width: 8),
                              Expanded(child: Text('Supabase belum dikonfigurasi. APK ini built tanpa --dart-define.', style: TextStyle(color: Colors.red.shade800, fontSize: 12))),
                            ],),
                          ),
                        const SizedBox(height: 32),
                        TextFormField(
                          controller: _email,
                          keyboardType: TextInputType.emailAddress,
                          decoration: const InputDecoration(labelText: 'Email', prefixIcon: Icon(Icons.email_outlined), border: OutlineInputBorder()),
                          validator: (v) => (v == null || !v.contains('@')) ? 'Email tidak valid' : null,
                          autofillHints: const [AutofillHints.email],
                        ),
                        const SizedBox(height: 16),
                        TextFormField(
                          controller: _pass,
                          obscureText: _obscure,
                          decoration: InputDecoration(
                            labelText: 'Password',
                            prefixIcon: const Icon(Icons.lock_outline),
                            border: const OutlineInputBorder(),
                            suffixIcon: IconButton(
                              icon: Icon(_obscure ? Icons.visibility_off : Icons.visibility),
                              onPressed: () => setState(() => _obscure = !_obscure),
                            ),
                          ),
                          validator: (v) => (v == null || v.length < 6) ? 'Minimal 6 karakter' : null,
                        ),
                        Align(
                          alignment: Alignment.centerRight,
                          child: TextButton(onPressed: () => context.go('/reset-password'), child: const Text('Lupa Password?')),
                        ),
                        const SizedBox(height: 8),
                        BrandButton(
                          label: 'Masuk',
                          loading: loading,
                          onPressed: () {
                            if (!_form.currentState!.validate()) return;
                            context.read<AuthBloc>().add(AuthLoginRequested(_email.text.trim(), _pass.text));
                          },
                        ),
                        if (failure != null)
                          Container(
                            margin: const EdgeInsets.only(top: 12),
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(color: Colors.red.shade50, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.red.shade200)),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(children: [
                                  const Icon(Icons.error_outline, color: Colors.red, size: 18),
                                  const SizedBox(width: 8),
                                  Expanded(child: Text(failure.message, style: TextStyle(color: Colors.red.shade800, fontSize: 13))),
                                ]),
                                const SizedBox(height: 8),
                                SizedBox(
                                  width: double.infinity,
                                  child: OutlinedButton.icon(
                                    icon: const Icon(Icons.copy, size: 14),
                                    label: const Text('Salin Error', style: TextStyle(fontSize: 12)),
                                    style: OutlinedButton.styleFrom(side: BorderSide(color: Colors.red.shade300)),
                                    onPressed: () {
                                      Clipboard.setData(ClipboardData(text: 'FVMS Login Error: ${failure.message}'));
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        const SnackBar(content: Text('Error disalin'), duration: Duration(seconds: 2)),
                                      );
                                    },
                                  ),
                                ),
                              ],
                            ),
                          ),
                        if (failure != null && failure.message.contains('Link reset'))
                          Padding(
                            padding: const EdgeInsets.only(top: 12),
                            child: Text(failure.message, style: const TextStyle(color: BrandColors.brand), textAlign: TextAlign.center),
                          ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
